from __future__ import annotations

from importlib import import_module
from types import SimpleNamespace

import pytest
from django.apps import apps as django_apps

from moviqo.modules.organizations.models import Membership, MembershipRole, Organization

identity_migration = import_module(
    "moviqo.modules.organizations.migrations.0005_enforce_single_organization_identity"
)


@pytest.mark.django_db(transaction=True)
def test_backfill_normalized_emails_rejects_duplicate_legacy_identities() -> None:
    fake_users = [
        SimpleNamespace(id=1, email="Owner@Example.com"),
        SimpleNamespace(id=2, email=" owner@example.com "),
    ]

    class FakeQuerySet(list):
        def all(self):
            return self

        def only(self, *_args):
            return self

    class FakeUserModel:
        objects = FakeQuerySet(fake_users)

    class FakeApps:
        @staticmethod
        def get_model(_app_label, _model_name):
            return FakeUserModel

    with pytest.raises(RuntimeError, match="duplicate identities"):
        identity_migration.backfill_normalized_emails(apps=FakeApps(), schema_editor=None)


@pytest.mark.django_db(transaction=True)
def test_fail_on_multi_membership_users_rejects_legacy_multi_org_accounts(
    django_user_model,
    monkeypatch,
) -> None:
    user = django_user_model.objects.create_user(username="owner-a", email="owner@example.com")
    organization = Organization.objects.create(slug="org-a", display_name="Org A")
    Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.OWNER,
    )

    class FakeMembershipQuerySet:
        def values_list(self, *_args, **_kwargs):
            return self

        def order_by(self, *_args):
            return self

        def distinct(self):
            return [user.id]

    class FakeMembershipCountQuerySet:
        def count(self):
            return 2

    original_filter = Membership.objects.filter
    call_count = 0

    def fake_filter(*args, **kwargs):
        nonlocal call_count
        if kwargs == {"user_id": user.id}:
            call_count += 1
            if call_count == 1:
                return FakeMembershipCountQuerySet()
        return original_filter(*args, **kwargs)

    monkeypatch.setattr(
        Membership.objects,
        "values_list",
        lambda *_args, **_kwargs: FakeMembershipQuerySet(),
    )
    monkeypatch.setattr(Membership.objects, "filter", fake_filter)

    with pytest.raises(RuntimeError, match="multi-membership accounts"):
        identity_migration.fail_on_multi_membership_users(apps=django_apps, schema_editor=None)
