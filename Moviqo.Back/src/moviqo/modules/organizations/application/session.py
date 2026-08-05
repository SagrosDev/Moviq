from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth import authenticate, login, logout
from rest_framework.exceptions import PermissionDenied

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.organizations.authentication import (
    AUTH_FAILURE_LIMIT,
    clear_login_failures,
    login_risk,
    record_login_failure,
)
from moviqo.modules.organizations.models import (
    Membership,
    MoviqoUser,
    RegistrationWorkflowState,
    TeamMembership,
)

GENERIC_LOGIN_CODE = "authentication_failed"


@dataclass(frozen=True)
class ActiveMembershipRecord:
    membership_id: str
    organization_id: str
    user_id: int
    role: str


def active_membership_for_user(user: MoviqoUser):
    memberships = list(
        Membership.objects.select_related("organization")
        .filter(
            user=user,
            is_active=True,
            registration_state=RegistrationWorkflowState.ACTIVE,
            organization__is_active=True,
            organization__registration_state=RegistrationWorkflowState.ACTIVE,
        )
        .order_by("organization_id", "id")
    )
    return memberships[0] if len(memberships) == 1 else None


def authenticate_session(*, request, email: str, password: str):
    normalized_email = email.strip().lower()
    risk = login_risk(
        email=normalized_email,
        remote_address=request.META.get("REMOTE_ADDR", "unknown"),
    )
    if risk.attempts >= AUTH_FAILURE_LIMIT:
        return None

    user = authenticate(request, username=normalized_email, password=password)
    membership = active_membership_for_user(user) if user is not None and user.is_active else None
    if user is None or membership is None:
        record_login_failure(risk)
        return None

    clear_login_failures(risk)
    login(request, user)
    return membership


def session_context(user: MoviqoUser) -> dict[str, object]:
    membership = active_membership_for_user(user)
    if not user.is_active or membership is None:
        raise PermissionDenied("authentication required")
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "displayName": user.display_name,
            "preferredLanguage": user.preferred_language,
        },
        "membership": {
            "id": membership.id,
            "organizationId": membership.organization_id,
            "organizationTimezone": membership.organization.timezone_name,
            "role": membership.role,
        },
    }


def end_session(request) -> None:
    logout(request)


def read_active_membership(*, tenant_context: TenantContext) -> ActiveMembershipRecord | None:
    membership = (
        Membership.objects.select_related("user", "organization")
        .filter(
            id=tenant_context.membership_id,
            organization_id=tenant_context.organization_id,
            is_active=True,
            user__is_active=True,
            organization__is_active=True,
            registration_state=RegistrationWorkflowState.ACTIVE,
            organization__registration_state=RegistrationWorkflowState.ACTIVE,
        )
        .first()
    )
    return _membership_record(membership)


def read_active_membership_by_id(
    *,
    organization_id,
    membership_id,
) -> ActiveMembershipRecord | None:
    membership = (
        Membership.objects.select_related("user", "organization")
        .filter(
            id=membership_id,
            organization_id=organization_id,
            is_active=True,
            user__is_active=True,
            organization__is_active=True,
            registration_state=RegistrationWorkflowState.ACTIVE,
            organization__registration_state=RegistrationWorkflowState.ACTIVE,
        )
        .first()
    )
    return _membership_record(membership)


def list_active_team_ids(*, tenant_context: TenantContext) -> set[str]:
    return {
        str(team_membership.team_id)
        for team_membership in TeamMembership.objects.select_related(
            "team",
            "membership",
        ).filter(
            organization_id=tenant_context.organization_id,
            membership_id=tenant_context.membership_id,
            is_active=True,
            membership__is_active=True,
            membership__user__is_active=True,
            team__is_active=True,
        )
    }


def _membership_record(membership: Membership | None) -> ActiveMembershipRecord | None:
    if membership is None:
        return None
    return ActiveMembershipRecord(
        membership_id=str(membership.id),
        organization_id=str(membership.organization_id),
        user_id=membership.user_id,
        role=membership.role,
    )
