from __future__ import annotations

import pytest

from moviqo.modules.organizations.application.identity_boundary import (
    IdentityBoundaryViolation,
    ensure_identity_membership,
)
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization


@pytest.mark.django_db(transaction=True)
def test_reactivation_stays_bound_to_the_original_organization(django_user_model) -> None:
    original_organization = Organization.objects.create(
        slug="org-a",
        display_name="Org A",
    )
    other_organization = Organization.objects.create(
        slug="org-b",
        display_name="Org B",
    )
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="owner@example.com",
        is_active=False,
    )
    membership = Membership.objects.create(
        organization=original_organization,
        user=user,
        role=MembershipRole.MEMBER,
        is_active=False,
    )

    result = ensure_identity_membership(
        organization=original_organization,
        email=" owner@example.com ",
        username="ignored",
        role=MembershipRole.ADMINISTRATOR,
    )

    membership.refresh_from_db()
    user.refresh_from_db()

    assert result.reactivated_membership is True
    assert membership.organization_id == original_organization.id
    assert membership.is_active is True
    assert membership.role == MembershipRole.ADMINISTRATOR
    assert user.is_active is True

    with pytest.raises(IdentityBoundaryViolation):
        ensure_identity_membership(
            organization=other_organization,
            email="owner@example.com",
            username="owner-b",
        )

    membership.refresh_from_db()
    assert membership.organization_id == original_organization.id
