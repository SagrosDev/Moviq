from __future__ import annotations

import importlib
import sys

import pytest

PRODUCTION_ENV = {
    "MOVIQO_SECRET_KEY": "production-only-contract-key-with-sufficient-length",
    "MOVIQO_ALLOWED_HOSTS": "app.moviqo.example,api.moviqo.example",
    "MOVIQO_CSRF_TRUSTED_ORIGINS": "https://app.moviqo.example,https://api.moviqo.example",
    "MOVIQO_TRUST_X_FORWARDED_PROTO": "true",
    "MOVIQO_DB_NAME": "moviqo",
    "MOVIQO_DB_USER": "moviqo",
    "MOVIQO_DB_PASSWORD": "database-secret",
    "MOVIQO_DB_HOST": "db.moviqo.internal",
    "MOVIQO_DB_PORT": "5432",
    "MOVIQO_GCS_PRIVATE_BUCKET": "moviqo-private-files",
    "MOVIQO_GCS_QUARANTINE_BUCKET": "moviqo-quarantine-files",
    "MOVIQO_GCS_CLEAN_BUCKET": "moviqo-clean-files",
    "MOVIQO_RESEND_API_KEY": "re_contract_only",
    "MOVIQO_RESEND_FROM_EMAIL": "Moviqo <notifications@updates.mymoviqo.com>",
}


def test_production_settings_load_with_explicit_secure_contract(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _set_production_env(monkeypatch)

    settings_module = _reload_production_settings()

    assert settings_module.CSRF_TRUSTED_ORIGINS == [
        "https://app.moviqo.example",
        "https://api.moviqo.example",
    ]
    assert settings_module.SECURE_PROXY_SSL_HEADER == ("HTTP_X_FORWARDED_PROTO", "https")
    assert getattr(settings_module, "USE_X_FORWARDED_HOST", False) is False
    assert settings_module.SESSION_COOKIE_SECURE is True
    assert settings_module.SESSION_COOKIE_NAME == "__session"
    assert settings_module.CSRF_COOKIE_SECURE is True
    assert settings_module.CSRF_USE_SESSIONS is True
    assert settings_module.SECURE_SSL_REDIRECT is True
    assert settings_module.MOVIQO_GCS_PRIVATE_BUCKET == "moviqo-private-files"
    assert settings_module.MOVIQO_RESEND_API_KEY == "re_contract_only"
    assert settings_module.MOVIQO_RESEND_FROM_EMAIL == (
        "Moviqo <notifications@updates.mymoviqo.com>"
    )


@pytest.mark.parametrize(
    ("env_name", "value", "message"),
    [
        ("MOVIQO_ALLOWED_HOSTS", "*", "must not contain '\\*'"),
        ("MOVIQO_ALLOWED_HOSTS", "localhost", "must not trust localhost hosts"),
        ("MOVIQO_ALLOWED_HOSTS", "::1", "must not trust localhost hosts"),
        (
            "MOVIQO_CSRF_TRUSTED_ORIGINS",
            "http://app.moviqo.example",
            "must contain absolute HTTPS origins",
        ),
        (
            "MOVIQO_CSRF_TRUSTED_ORIGINS",
            "https://localhost",
            "must not trust localhost origins",
        ),
        (
            "MOVIQO_CSRF_TRUSTED_ORIGINS",
            "https://evil.example",
            "must match MOVIQO_ALLOWED_HOSTS",
        ),
        (
            "MOVIQO_TRUST_X_FORWARDED_PROTO",
            "false",
            "must trust HTTPS only through HTTP_X_FORWARDED_PROTO=https",
        ),
        (
            "MOVIQO_GCS_PRIVATE_BUCKET",
            "moviqo-public-files",
            "must reference private-only storage",
        ),
        ("MOVIQO_RESEND_API_KEY", None, "Missing required environment variable"),
        ("MOVIQO_RESEND_FROM_EMAIL", None, "Missing required environment variable"),
    ],
)
def test_production_settings_fail_closed_on_unsafe_security_contract(
    monkeypatch: pytest.MonkeyPatch,
    env_name: str,
    value: str | None,
    message: str,
) -> None:
    _set_production_env(monkeypatch)
    if value is None:
        monkeypatch.delenv(env_name, raising=False)
    else:
        monkeypatch.setenv(env_name, value)

    with pytest.raises(RuntimeError, match=message):
        _reload_production_settings()


def _set_production_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key, value in PRODUCTION_ENV.items():
        monkeypatch.setenv(key, value)


def _reload_production_settings():
    for module_name in [
        "moviqo.settings.base",
        "moviqo.settings.security",
        "moviqo.settings.production",
    ]:
        sys.modules.pop(module_name, None)
    return importlib.import_module("moviqo.settings.production")
