from __future__ import annotations

from django.contrib.auth import authenticate, login, logout
from rest_framework.exceptions import PermissionDenied

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
)

GENERIC_LOGIN_CODE = "authentication_failed"


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
            "role": membership.role,
        },
    }


def end_session(request) -> None:
    logout(request)
