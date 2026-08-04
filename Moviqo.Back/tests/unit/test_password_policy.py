from __future__ import annotations

import pytest
from django.contrib.auth.hashers import identify_hasher

from moviqo.modules.organizations.application.password_policy import (
    CredentialValidationError,
    create_user_with_validated_password,
    set_user_password,
    validate_password_policy,
)


@pytest.mark.parametrize(
    ("raw_password", "expected_code"),
    [
        ("fourteen-chars", "password_too_short"),
        ("p" * 129, "password_too_long"),
        ("passwordpassword", "password_blocklisted"),
    ],
)
def test_password_policy_rejects_invalid_lengths_and_blocklisted_values(
    raw_password: str,
    expected_code: str,
) -> None:
    with pytest.raises(CredentialValidationError) as exc_info:
        validate_password_policy(raw_password, locale="en")

    assert exc_info.value.codes == (expected_code,)
    assert all(raw_password not in message for message in exc_info.value.messages)


def test_password_policy_accepts_spaces_and_unicode_without_composition_rules() -> None:
    normalized_password = validate_password_policy("  café clave segura 2026  ", locale="es")

    assert normalized_password == "  café clave segura 2026  "


@pytest.mark.parametrize("raw_password", ("p" * 15, "p" * 128))
def test_password_policy_accepts_exact_length_boundaries(raw_password: str) -> None:
    normalized_password = validate_password_policy(raw_password, locale="en")

    assert normalized_password == raw_password


@pytest.mark.django_db
def test_create_user_with_validated_password_persists_only_a_hash(django_user_model) -> None:
    raw_password = "usable passphrase 2026"

    user = create_user_with_validated_password(
        username="owner-a",
        email="owner@example.com",
        password=raw_password,
        is_active=True,
    )

    user.refresh_from_db()

    assert user.password != raw_password
    assert user.check_password(raw_password) is True
    assert identify_hasher(user.password).algorithm == "md5"


@pytest.mark.django_db
def test_create_user_with_validated_password_rejects_invalid_value_without_creating_user(
    django_user_model,
) -> None:
    with pytest.raises(CredentialValidationError):
        create_user_with_validated_password(
            username="owner-a",
            email="owner@example.com",
            password="passwordpassword",
        )

    assert django_user_model.objects.count() == 0


@pytest.mark.django_db
def test_set_user_password_rejects_invalid_value_without_partial_update(django_user_model) -> None:
    user = django_user_model.objects.create_user(
        username="owner-a",
        email="owner@example.com",
        password="usable passphrase 2026",
    )
    original_hash = user.password

    with pytest.raises(CredentialValidationError):
        set_user_password(user, "short password")

    user.refresh_from_db()

    assert user.password == original_hash
    assert user.check_password("usable passphrase 2026") is True
