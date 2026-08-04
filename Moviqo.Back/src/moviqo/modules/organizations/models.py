from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q

from moviqo.modules.organizations.user_managers import MoviqoUserManager


class MoviqoUser(AbstractUser):
    """Minimal custom user model required before the first migration."""

    normalized_email = models.CharField(max_length=254, blank=True, default="")

    objects = MoviqoUserManager()

    def save(self, *args, **kwargs):
        self.email = self.__class__.objects.normalize_email(self.email)
        self.normalized_email = self.__class__.objects.normalize_email(self.email)
        super().save(*args, **kwargs)

    class Meta:
        db_table = "organizations_moviqo_user"
        constraints = [
            models.UniqueConstraint(
                fields=("normalized_email",),
                condition=~Q(normalized_email=""),
                name="organizations_moviqo_user_normalized_email_unique",
            )
        ]


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
            ),
            models.UniqueConstraint(
                fields=("user",),
                name="organizations_membership_user_unique",
            ),
        ]
