# Generated for Moviqo Story 1.9.

from __future__ import annotations

from django.db import migrations, models
from django.db.models import Q


def _normalize_email(value: str) -> str:
    return value.strip().lower()


def backfill_normalized_emails(apps, schema_editor) -> None:
    user_model = apps.get_model("organizations", "MoviqoUser")

    duplicate_emails = {}
    for user in user_model.objects.all().only("id", "email"):
        normalized_email = _normalize_email(user.email or "")
        if normalized_email:
            duplicate_emails.setdefault(normalized_email, []).append(user.id)

    conflicting_emails = {
        email: ids for email, ids in duplicate_emails.items() if len(ids) > 1
    }
    if conflicting_emails:
        raise RuntimeError(
            "Cannot enforce normalized email uniqueness until duplicate identities are "
            f"resolved: {sorted(conflicting_emails)}"
        )

    for user in user_model.objects.all().only("id", "email"):
        normalized_email = _normalize_email(user.email or "")
        user_model.objects.filter(id=user.id).update(
            email=normalized_email,
            normalized_email=normalized_email,
        )


def fail_on_multi_membership_users(apps, schema_editor) -> None:
    membership_model = apps.get_model("organizations", "Membership")

    duplicate_user_ids = []
    for user_id in (
        membership_model.objects.values_list("user_id", flat=True)
        .order_by("user_id")
        .distinct()
    ):
        if membership_model.objects.filter(user_id=user_id).count() > 1:
            duplicate_user_ids.append(user_id)

    if duplicate_user_ids:
        raise RuntimeError(
            "Cannot enforce single-organization identity until multi-membership accounts "
            f"are resolved: {duplicate_user_ids}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0004_sync_runtime_role_membership"),
    ]

    operations = [
        migrations.AddField(
            model_name="moviqouser",
            name="normalized_email",
            field=models.CharField(blank=True, default="", max_length=254),
        ),
        migrations.RunPython(
            backfill_normalized_emails,
            migrations.RunPython.noop,
        ),
        migrations.RunPython(
            fail_on_multi_membership_users,
            migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="moviqouser",
            constraint=models.UniqueConstraint(
                condition=~Q(normalized_email=""),
                fields=("normalized_email",),
                name="organizations_moviqo_user_normalized_email_unique",
            ),
        ),
        migrations.AddConstraint(
            model_name="membership",
            constraint=models.UniqueConstraint(
                fields=("user",),
                name="organizations_membership_user_unique",
            ),
        ),
    ]
