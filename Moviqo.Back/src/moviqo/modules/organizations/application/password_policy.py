from __future__ import annotations

import unicodedata
from dataclasses import dataclass

from django.contrib.auth.password_validation import (
    get_default_password_validators,
    validate_password,
)
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework.exceptions import ErrorDetail
from rest_framework.exceptions import ValidationError as DrfValidationError

from moviqo.modules.organizations.models import MoviqoUser

PASSWORD_MIN_LENGTH = 15
PASSWORD_MAX_LENGTH = 128

PASSWORD_POLICY_MESSAGES = {
    "en": {
        "password_too_short": "Use at least 15 characters.",
        "password_too_long": "Use no more than 128 characters.",
        "password_blocklisted": (
            "Choose a harder-to-guess password that is not listed as common or exposed."
        ),
    },
    "es": {
        "password_too_short": "Usa al menos 15 caracteres.",
        "password_too_long": "Usa no mas de 128 caracteres.",
        "password_blocklisted": (
            "Elige una contrasena mas dificil de adivinar o que no figure como expuesta."
        ),
    },
}

APPROVED_PASSWORD_BLOCKLIST = frozenset(
    {
        "passwordpassword",
        "letmeinletmein",
        "123456789012345",
        "qwertyqwerty123",
        "welcome to moviqo",
    }
)


def normalize_password(password: str) -> str:
    return unicodedata.normalize("NFKC", password)


def _normalize_blocklist_candidate(password: str) -> str:
    return normalize_password(password).casefold()


class MoviqoPasswordPolicyValidator:
    def validate(self, password: str, user=None) -> None:
        normalized_password = normalize_password(password)
        password_length = len(normalized_password)

        if password_length < PASSWORD_MIN_LENGTH:
            raise DjangoValidationError(
                PASSWORD_POLICY_MESSAGES["en"]["password_too_short"],
                code="password_too_short",
            )

        if password_length > PASSWORD_MAX_LENGTH:
            raise DjangoValidationError(
                PASSWORD_POLICY_MESSAGES["en"]["password_too_long"],
                code="password_too_long",
            )

        if _normalize_blocklist_candidate(normalized_password) in APPROVED_PASSWORD_BLOCKLIST:
            raise DjangoValidationError(
                PASSWORD_POLICY_MESSAGES["en"]["password_blocklisted"],
                code="password_blocklisted",
            )

    def get_help_text(self) -> str:
        return "Use 15 to 128 characters. Avoid common or exposed passwords."


@dataclass(frozen=True)
class PasswordPolicyViolation:
    code: str
    message: str


class CredentialValidationError(Exception):
    def __init__(self, *, locale: str, violations: tuple[PasswordPolicyViolation, ...]) -> None:
        self.locale = _resolve_locale(locale)
        self.violations = violations
        super().__init__("; ".join(violation.message for violation in violations))

    @property
    def codes(self) -> tuple[str, ...]:
        return tuple(violation.code for violation in self.violations)

    @property
    def messages(self) -> tuple[str, ...]:
        return tuple(violation.message for violation in self.violations)

    def as_drf_error(self) -> DrfValidationError:
        return DrfValidationError(
            {
                "password": [
                    ErrorDetail(violation.message, code=violation.code)
                    for violation in self.violations
                ]
            }
        )

    @classmethod
    def from_codes(
        cls,
        codes: tuple[str, ...],
        *,
        locale: str,
    ) -> CredentialValidationError:
        resolved_locale = _resolve_locale(locale)
        return cls(
            locale=resolved_locale,
            violations=tuple(
                PasswordPolicyViolation(
                    code=code,
                    message=PASSWORD_POLICY_MESSAGES[resolved_locale][code],
                )
                for code in codes
            ),
        )


def validate_password_policy(
    raw_password: str,
    *,
    user: MoviqoUser | None = None,
    locale: str = "en",
) -> str:
    normalized_password = normalize_password(raw_password)
    resolved_locale = _resolve_locale(locale)

    try:
        validate_password(
            normalized_password,
            user=user,
            password_validators=get_default_password_validators(),
        )
    except DjangoValidationError as exc:
        raise CredentialValidationError(
            locale=resolved_locale,
            violations=tuple(
                PasswordPolicyViolation(
                    code=_resolve_error_code(error.code),
                    message=_localized_message(_resolve_error_code(error.code), resolved_locale),
                )
                for error in exc.error_list
            ),
        ) from exc

    return normalized_password


@transaction.atomic
def create_user_with_validated_password(
    *,
    username: str,
    email: str,
    password: str,
    locale: str = "en",
    **extra_fields,
) -> MoviqoUser:
    normalized_password = validate_password_policy(password, locale=locale)
    user = MoviqoUser(username=username, email=email, **extra_fields)
    user.set_password(normalized_password)
    user.save()
    return user


@transaction.atomic
def set_user_password(
    user: MoviqoUser,
    password: str,
    *,
    locale: str = "en",
) -> str:
    normalized_password = validate_password_policy(password, user=user, locale=locale)
    user.set_password(normalized_password)
    user.save(update_fields=["password"])
    return normalized_password


def _resolve_locale(locale: str) -> str:
    return locale if locale in PASSWORD_POLICY_MESSAGES else "en"


def _resolve_error_code(code: str | None) -> str:
    if code in PASSWORD_POLICY_MESSAGES["en"]:
        return str(code)
    return "password_blocklisted"


def _localized_message(code: str, locale: str) -> str:
    return PASSWORD_POLICY_MESSAGES[locale][code]
