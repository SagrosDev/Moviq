from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class MoviqoUser(AbstractUser):
    """Minimal custom user model required before the first migration."""

    class Meta:
        db_table = "organizations_moviqo_user"


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    slug = models.SlugField(max_length=80, unique=True)
    display_name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations_organization"


class MembershipRole(models.TextChoices):
    OWNER = "owner", "Owner"
    ADMINISTRATOR = "administrator", "Administrator"
    DESIGNER = "designer", "Designer"
    MEMBER = "member", "Member"


class Membership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="memberships",
    )
    user = models.ForeignKey(
        MoviqoUser,
        on_delete=models.PROTECT,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=32,
        choices=MembershipRole.choices,
        default=MembershipRole.MEMBER,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations_membership"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "user"),
                name="organizations_membership_organization_user_unique",
            )
        ]
