from __future__ import annotations

import pytest
from django.db import IntegrityError

from moviqo.modules.organizations.application.identity_boundary import (
    IdentityBoundaryViolation,
    UnsupportedIdentityState,
    ensure_identity_membership,
    normalize_identity_email,
)
from moviqo.modules.organizations.models import Membership, MembershipRole, Organization


def test_normalize_identity_email_lowercases_the_full_address() -> None:
    assert normalize_identity_email(" Owner.Name+Tag@Example.COM ") == "owner.name+tag@example.com"


@pytest.mark.django_db
def test_identity_membership_creation_normalizes_email_and_creates_a_single_membership() -> None:
    organization = Organization.objects.create(slug="org-a", display_name="Org A")

    result = ensure_identity_membership(
        organization=organization,
        email=" Owner@Example.com ",
        username="owner-a",
        role=MembershipRole.OWNER,
    )

    assert result.created_user is True
    assert result.created_membership is True
    assert result.reactivated_membership is False
    assert result.membership.organization_id == organization.id
    assert result.membership.user.email == "owner@example.com"
    assert result.membership.user.normalized_email == "owner@example.com"
    assert Membership.objects.filter(user=result.membership.user).count() == 1


@pytest.mark.django_db
def test_identity_membership_reactivates_only_inside_the_original_organization(
    django_user_model,
) -> None:
    organization = Organization.objects.create(slug="org-a", display_name="Org A")
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="owner@example.com",
        is_active=False,
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.MEMBER,
        is_active=False,
    )

    result = ensure_identity_membership(
        organization=organization,
        email="OWNER@example.com",
        username="ignored",
        role=MembershipRole.ADMINISTRATOR,
    )

    membership.refresh_from_db()
    user.refresh_from_db()

    assert result.created_user is False
    assert result.created_membership is False
    assert result.reactivated_membership is True
    assert membership.is_active is True
    assert membership.role == MembershipRole.ADMINISTRATOR
    assert user.is_active is True


@pytest.mark.django_db
def test_identity_membership_reactivates_an_inactive_user_with_active_membership(
    django_user_model,
) -> None:
    organization = Organization.objects.create(slug="org-a", display_name="Org A")
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="owner@example.com",
        is_active=False,
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
        is_active=True,
    )

    result = ensure_identity_membership(
        organization=organization,
        email="owner@example.com",
        username="ignored",
    )

    user.refresh_from_db()

    assert result.membership.id == membership.id
    assert result.reactivated_membership is False
    assert user.is_active is True


@pytest.mark.django_db
def test_identity_membership_reactivates_an_inactive_user_before_creating_membership(
    django_user_model,
) -> None:
    organization = Organization.objects.create(slug="org-a", display_name="Org A")
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="owner@example.com",
        is_active=False,
    )

    result = ensure_identity_membership(
        organization=organization,
        email=" owner@example.com ",
        username="ignored",
    )

    user.refresh_from_db()

    assert result.created_membership is True
    assert result.membership.user_id == user.id
    assert user.is_active is True


@pytest.mark.django_db
def test_identity_membership_rejects_cross_organization_reuse_of_an_email(
    django_user_model,
) -> None:
    organization_a = Organization.objects.create(slug="org-a", display_name="Org A")
    organization_b = Organization.objects.create(slug="org-b", display_name="Org B")
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="owner@example.com",
    )
    Membership.objects.create(
        organization=organization_a,
        user=user,
        role=MembershipRole.OWNER,
    )

    with pytest.raises(IdentityBoundaryViolation):
        ensure_identity_membership(
            organization=organization_b,
            email="owner@example.com",
            username="owner-b",
        )


@pytest.mark.django_db
def test_identity_membership_rejects_unsupported_multi_membership_state(
    django_user_model,
    monkeypatch,
) -> None:
    organization = Organization.objects.create(slug="org-a", display_name="Org A")
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="owner@example.com",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
    )

    from moviqo.modules.organizations.application import identity_boundary

    monkeypatch.setattr(
        identity_boundary,
        "_memberships_for_user",
        lambda _user: [membership, membership],
    )

    with pytest.raises(UnsupportedIdentityState):
        ensure_identity_membership(
            organization=organization,
            email="owner@example.com",
            username="owner-a",
        )


@pytest.mark.django_db
def test_identity_membership_recovers_when_user_creation_races(
    django_user_model,
    monkeypatch,
) -> None:
    organization = Organization.objects.create(slug="org-a", display_name="Org A")
    original_create_user = django_user_model.objects.create_user
    call_count = 0

    def racing_create_user(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            original_create_user(username="owner-b", email="owner@example.com")
            raise IntegrityError("duplicate key value violates unique constraint")
        return original_create_user(*args, **kwargs)

    monkeypatch.setattr(django_user_model.objects, "create_user", racing_create_user)

    result = ensure_identity_membership(
        organization=organization,
        email="owner@example.com",
        username="owner-a",
    )

    assert result.created_user is False
    assert result.created_membership is True
    assert result.membership.user.normalized_email == "owner@example.com"
