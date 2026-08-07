from __future__ import annotations

import importlib
import sys

import pytest

from moviqo.settings.uat_contract import load_uat_contract

UAT_ENV = {
    "MOVIQO_SECRET_KEY": "test-only-secret",
    "MOVIQO_ALLOWED_HOSTS": "uat.moviqo.internal",
    "MOVIQO_CSRF_TRUSTED_ORIGINS": "https://uat.moviqo.internal",
    "MOVIQO_TRUST_X_FORWARDED_PROTO": "true",
    "MOVIQO_DB_NAME": "moviqo_uat",
    "MOVIQO_DB_USER": "moviqo_uat",
    "MOVIQO_DB_PASSWORD": "moviqo_uat_password",
    "MOVIQO_DB_HOST": "db.uat.supabase.internal",
    "MOVIQO_DB_PORT": "5432",
    "MOVIQO_ENVIRONMENT_CLASS": "synthetic-only",
    "MOVIQO_BUILD_ID": "build-20260803.1",
    "MOVIQO_SERVICE_CLASS": "uat-internal",
    "MOVIQO_SERVICE_NAME": "moviqo-back-uat",
    "MOVIQO_CLOUD_PROJECT_ID": "moviqo-uat-synthetic",
    "MOVIQO_SYNTHETIC_VERIFICATION_API_KEY": "synthetic-link-key-20260806",
    "MOVIQO_DJANGO_SECRET_KEY_SECRET": "moviqo-uat-django-secret",
    "MOVIQO_DB_PASSWORD_SECRET": "moviqo-uat-db-password",
    "MOVIQO_RESEND_API_KEY_SECRET": "moviqo-uat-resend-api-key",
    "MOVIQO_GCS_PRIVATE_BUCKET": "moviqo-uat-private",
    "MOVIQO_GCS_QUARANTINE_BUCKET": "moviqo-uat-quarantine",
    "MOVIQO_GCS_CLEAN_BUCKET": "moviqo-uat-clean",
    "MOVIQO_FILE_INSPECTION_ADAPTER": "synthetic",
    "MOVIQO_MESSAGE_DELIVERY_ADAPTER": "resend-outbox",
    "MOVIQO_CACHE_POLICY": "firebase-hosting-no-store",
    "MOVIQO_LIVE_MALWARE_SCANNING": "disabled-by-gate",
    "MOVIQO_INDEPENDENT_BACKUPS": "disabled-by-gate",
    "MOVIQO_LIFECYCLE_SCHEDULES": "disabled-by-gate",
}


def test_uat_contract_loads_when_environment_is_explicitly_synthetic(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _set_uat_env(monkeypatch)

    contract = load_uat_contract()

    assert contract["environment_class"] == "synthetic-only"
    assert contract["file_inspection_adapter"] == "synthetic"
    assert contract["job_runners"] == {"outboxEmailDrain": "outbox-email-drain"}
    assert contract["disabled_services"] == {
        "liveMalwareScanning": "disabled-by-gate",
        "independentBackups": "disabled-by-gate",
        "lifecycleSchedules": "disabled-by-gate",
    }


@pytest.mark.parametrize(
    ("env_name", "value", "message"),
    [
        ("MOVIQO_ENVIRONMENT_CLASS", None, "Missing required environment variable"),
        (
            "MOVIQO_ENVIRONMENT_CLASS",
            "synthetic",
            "Invalid environment variable MOVIQO_ENVIRONMENT_CLASS",
        ),
        (
            "MOVIQO_CLOUD_PROJECT_ID",
            "moviqo-production",
            "must not reference production resources",
        ),
        (
            "MOVIQO_LIVE_MALWARE_SCANNING",
            "healthy",
            "must be declared as 'disabled-by-gate'",
        ),
        (
            "MOVIQO_FILE_INSPECTION_ADAPTER",
            "clamav",
            "synthetic file inspection adapter",
        ),
    ],
)
def test_uat_contract_fails_closed(
    monkeypatch: pytest.MonkeyPatch, env_name: str, value: str | None, message: str
) -> None:
    _set_uat_env(monkeypatch)
    if value is None:
        monkeypatch.delenv(env_name, raising=False)
    else:
        monkeypatch.setenv(env_name, value)

    with pytest.raises(RuntimeError, match=message):
        load_uat_contract()


def test_uat_settings_fail_during_import_when_contract_is_invalid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _set_uat_env(monkeypatch)
    monkeypatch.setenv("MOVIQO_ENVIRONMENT_CLASS", "ambiguous")

    with pytest.raises(RuntimeError, match="MOVIQO_ENVIRONMENT_CLASS"):
        _reload_uat_settings()


def test_uat_contract_does_not_require_inline_resend_api_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _set_uat_env(monkeypatch)
    monkeypatch.delenv("MOVIQO_RESEND_API_KEY", raising=False)

    contract = load_uat_contract()

    assert contract["resend_api_key_secret"] == "moviqo-uat-resend-api-key"
    assert contract["synthetic_verification_api_key"] == "synthetic-link-key-20260806"


def _set_uat_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key, value in UAT_ENV.items():
        monkeypatch.setenv(key, value)
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("SUPABASE_PROJECT_ID", raising=False)


def _reload_uat_settings():
    import os

    os.environ.setdefault("MOVIQO_RESEND_API_KEY", "uat-runtime-resend-key")
    for module_name in [
        "moviqo.settings.base",
        "moviqo.settings.production",
        "moviqo.settings.uat",
    ]:
        sys.modules.pop(module_name, None)
    return importlib.import_module("moviqo.settings.uat")
