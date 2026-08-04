from __future__ import annotations

from dataclasses import dataclass

from django.db import IntegrityError, transaction

from moviqo.modules.organizations.models import Membership, MembershipRole, MoviqoUser, Organization


class IdentityBoundaryViolation(Exception):
    """Raised when an email cannot cross the MVP organization boundary."""


class UnsupportedIdentityState(Exception):
    """Raised when existing data violates the single-membership MVP contract."""


@dataclass(frozen=True)
class IdentityBoundaryResult:
    membership: Membership
    created_user: bool
    created_membership: bool
    reactivated_membership: bool


def normalize_identity_email(email: str) -> str:
    return MoviqoUser.objects.normalize_email(email)


def _memberships_for_user(user: MoviqoUser) -> list[Membership]:
    return list(
        Membership.objects.select_related("organization")
        .filter(user=user)
        .order_by("created_at", "id")
    )


def _reactivate_user_if_needed(user: MoviqoUser) -> None:
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=["is_active"])


@transaction.atomic
def ensure_identity_membership(
    *,
    organization: Organization,
    email: str,
    username: str,
    role: str = MembershipRole.MEMBER,
) -> IdentityBoundaryResult:
    normalized_email = normalize_identity_email(email)
    if not normalized_email:
        raise IdentityBoundaryViolation("identity unavailable")

    user = (
        MoviqoUser.objects.select_for_update()
        .filter(normalized_email=normalized_email)
        .first()
    )
    if user is None:
        created_user = True
        try:
            user = MoviqoUser.objects.create_user(
                username=username,
                email=normalized_email,
                is_active=True,
            )
        except IntegrityError:
            user = (
                MoviqoUser.objects.select_for_update()
                .filter(normalized_email=normalized_email)
                .first()
            )
            if user is None:
                raise
            created_user = False
    else:
        created_user = False

    memberships = _memberships_for_user(user)
    if len(memberships) > 1:
        raise UnsupportedIdentityState("tenant context unavailable")

    if memberships:
        membership = memberships[0]
        if membership.organization_id != organization.id:
            raise IdentityBoundaryViolation("identity unavailable")
        if membership.is_active:
            _reactivate_user_if_needed(user)
            return IdentityBoundaryResult(
                membership=membership,
                created_user=created_user,
                created_membership=False,
                reactivated_membership=False,
            )

        membership.is_active = True
        membership.role = role
        membership.save(update_fields=["is_active", "role", "updated_at"])
        _reactivate_user_if_needed(user)
        return IdentityBoundaryResult(
            membership=membership,
            created_user=created_user,
            created_membership=False,
            reactivated_membership=True,
        )

    _reactivate_user_if_needed(user)
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=role,
    )
    return IdentityBoundaryResult(
        membership=membership,
        created_user=created_user,
        created_membership=True,
        reactivated_membership=False,
    )
