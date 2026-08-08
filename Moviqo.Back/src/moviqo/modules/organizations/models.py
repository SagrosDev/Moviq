from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q

from moviqo.modules.organizations.user_managers import MoviqoUserManager


class MoviqoUser(AbstractUser):
    """Minimal custom user model required before the first migration."""

    normalized_email = models.CharField(max_length=254, blank=True, default="")
    display_name = models.CharField(max_length=120, blank=True, default="")
    preferred_language = models.CharField(max_length=8, default="es")
    region_code = models.CharField(max_length=8, default="CO")
    timezone_name = models.CharField(max_length=64, default="UTC")
    currency_code = models.CharField(max_length=8, default="COP")

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
    registration_state = models.CharField(
        max_length=32,
        choices=[
            ("pending", "Pending"),
            ("active", "Active"),
            ("retired", "Retired"),
        ],
        default="active",
    )
    preferred_language = models.CharField(max_length=8, default="es")
    region_code = models.CharField(max_length=8, default="CO")
    timezone_name = models.CharField(max_length=64, default="UTC")
    currency_code = models.CharField(max_length=8, default="COP")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations_organization"


class MembershipRole(models.TextChoices):
    OWNER = "owner", "Owner"
    ADMINISTRATOR = "administrator", "Administrator"
    DESIGNER = "designer", "Designer"
    MEMBER = "member", "Member"


class RegistrationWorkflowState(models.TextChoices):
    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    RETIRED = "retired", "Retired"


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
    registration_state = models.CharField(
        max_length=32,
        choices=RegistrationWorkflowState.choices,
        default=RegistrationWorkflowState.ACTIVE,
    )
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


class Team(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="teams",
    )
    name = models.CharField(max_length=120)
    normalized_name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations_team"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "normalized_name"),
                name="organizations_team_organization_name_unique",
            )
        ]


class TeamMembership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="team_memberships",
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        related_name="memberships",
    )
    membership = models.ForeignKey(
        Membership,
        on_delete=models.PROTECT,
        related_name="team_memberships",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations_team_membership"
        constraints = [
            models.UniqueConstraint(
                fields=("team", "membership"),
                name="organizations_team_membership_team_membership_unique",
            )
        ]


class OrganizationRegistrationConsent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="registration_consents",
    )
    user = models.ForeignKey(
        MoviqoUser,
        on_delete=models.PROTECT,
        related_name="organization_registration_consents",
    )
    terms_accepted = models.BooleanField(default=False)
    privacy_accepted = models.BooleanField(default=False)
    terms_version = models.CharField(max_length=64)
    privacy_version = models.CharField(max_length=64)
    prohibited_data_acknowledged = models.BooleanField(default=False)
    accepted_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "organizations_registration_consent"


class RegistrationVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="registration_verifications",
    )
    user = models.ForeignKey(
        MoviqoUser,
        on_delete=models.PROTECT,
        related_name="registration_verifications",
    )
    membership = models.ForeignKey(
        Membership,
        on_delete=models.PROTECT,
        related_name="registration_verifications",
    )
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "organizations_registration_verification"


class PasswordRecoveryToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    user = models.ForeignKey(
        MoviqoUser,
        on_delete=models.CASCADE,
        related_name="password_recovery_tokens",
    )
    token_digest = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "organizations_password_recovery_token"
        indexes = [
            models.Index(fields=("user", "expires_at"), name="org_recovery_user_exp_idx"),
            models.Index(fields=("token_digest", "expires_at"), name="org_recovery_digest_exp_idx"),
        ]


class PasswordRecoveryThrottle(models.Model):
    key_digest = models.CharField(max_length=64, primary_key=True)
    window_started_at = models.DateTimeField()
    request_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "organizations_password_recovery_throttle"


class InitialRegistrationCommandResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid7, editable=False)
    normalized_email = models.CharField(max_length=254)
    idempotency_key = models.CharField(max_length=120)
    request_hash = models.CharField(max_length=128)
    result_payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "organizations_initial_registration_command_result"
        constraints = [
            models.UniqueConstraint(
                fields=("normalized_email", "idempotency_key"),
                name="organizations_initial_registration_command_result_unique",
            )
        ]
