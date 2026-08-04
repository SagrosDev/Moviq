from __future__ import annotations

from moviqo.modules.organizations.application.password_policy import (
    CredentialValidationError,
    create_user_with_validated_password,
    set_user_password,
    validate_password_policy,
)
from moviqo.modules.organizations.application.registration import (
    register_initial_owner,
    verify_initial_registration,
)
from moviqo.modules.organizations.application.session import active_membership_for_user
from moviqo.modules.organizations.application.tenant_access import resolve_tenant_context
from moviqo.modules.organizations.application.views import (
    CsrfTokenView,
    CurrentSessionView,
    InitialRegistrationView,
    PasswordRecoveryView,
    PasswordResetView,
    ProtectedMembershipDetailView,
    RegistrationVerificationView,
    SignInView,
    SignOutView,
)


def module_health() -> None:
    return None


__all__ = [
    "ProtectedMembershipDetailView",
    "CsrfTokenView",
    "CurrentSessionView",
    "CredentialValidationError",
    "InitialRegistrationView",
    "create_user_with_validated_password",
    "module_health",
    "register_initial_owner",
    "active_membership_for_user",
    "resolve_tenant_context",
    "RegistrationVerificationView",
    "PasswordRecoveryView",
    "PasswordResetView",
    "SignInView",
    "SignOutView",
    "set_user_password",
    "validate_password_policy",
    "verify_initial_registration",
]
