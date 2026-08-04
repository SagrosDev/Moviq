from __future__ import annotations

from os import getenv

from moviqo.settings.env import required_env, required_env_choice

PRODUCTION_KEYWORDS = ("prod", "production")
DISABLED_BY_GATE = "disabled-by-gate"


def load_uat_contract() -> dict[str, object]:
    disabled_services = {
        "liveMalwareScanning": required_env("MOVIQO_LIVE_MALWARE_SCANNING"),
        "independentBackups": required_env("MOVIQO_INDEPENDENT_BACKUPS"),
        "lifecycleSchedules": required_env("MOVIQO_LIFECYCLE_SCHEDULES"),
    }
    contract: dict[str, object] = {
        "environment_class": required_env_choice(
            "MOVIQO_ENVIRONMENT_CLASS", ("synthetic-only",)
        ),
        "build_id": required_env("MOVIQO_BUILD_ID"),
        "service_class": required_env("MOVIQO_SERVICE_CLASS"),
        "service_name": required_env("MOVIQO_SERVICE_NAME"),
        "cloud_project_id": required_env("MOVIQO_CLOUD_PROJECT_ID"),
        "database_host": required_env("MOVIQO_DB_HOST"),
        "django_secret_key_secret": required_env("MOVIQO_DJANGO_SECRET_KEY_SECRET"),
        "database_password_secret": required_env("MOVIQO_DB_PASSWORD_SECRET"),
        "resend_api_key_secret": required_env("MOVIQO_RESEND_API_KEY_SECRET"),
        "gcs_private_bucket": required_env("MOVIQO_GCS_PRIVATE_BUCKET"),
        "gcs_quarantine_bucket": required_env("MOVIQO_GCS_QUARANTINE_BUCKET"),
        "gcs_clean_bucket": required_env("MOVIQO_GCS_CLEAN_BUCKET"),
        "file_inspection_adapter": required_env("MOVIQO_FILE_INSPECTION_ADAPTER"),
        "message_delivery_adapter": required_env("MOVIQO_MESSAGE_DELIVERY_ADAPTER"),
        "cache_policy": required_env("MOVIQO_CACHE_POLICY"),
        "job_runners": _job_runners(required_env("MOVIQO_MESSAGE_DELIVERY_ADAPTER")),
        "disabled_services": disabled_services,
    }
    validate_uat_contract(contract)
    return contract


def validate_uat_contract(contract: dict[str, object]) -> None:
    if contract["file_inspection_adapter"] != "synthetic":
        raise RuntimeError(
            "UAT must use the synthetic file inspection adapter when "
            "environment class is synthetic-only."
        )

    if contract["message_delivery_adapter"] != "resend-outbox":
        raise RuntimeError("UAT must deliver email through the Resend outbox adapter.")
    if contract["job_runners"] != {"outboxEmailDrain": "outbox-email-drain"}:
        raise RuntimeError("UAT must expose only the outbox email drain runner path.")

    if contract["cache_policy"] != "firebase-hosting-no-store":
        raise RuntimeError("UAT must declare the firebase-hosting-no-store cache policy.")

    for service_name, status in contract["disabled_services"].items():
        if status != DISABLED_BY_GATE:
            raise RuntimeError(
                f"UAT service '{service_name}' must be declared as "
                f"{DISABLED_BY_GATE!r}, got {status!r}."
            )

    for name in (
        "cloud_project_id",
        "database_host",
        "django_secret_key_secret",
        "database_password_secret",
        "resend_api_key_secret",
        "gcs_private_bucket",
        "gcs_quarantine_bucket",
        "gcs_clean_bucket",
    ):
        _reject_production_identifier(name, str(contract[name]))

    for env_name in ("GOOGLE_CLOUD_PROJECT", "SUPABASE_PROJECT_ID"):
        value = getenv(env_name)
        if value:
            _reject_production_identifier(env_name.lower(), value)


def _reject_production_identifier(name: str, value: str) -> None:
    normalized = value.lower()
    if any(keyword in normalized for keyword in PRODUCTION_KEYWORDS):
        raise RuntimeError(f"UAT configuration must not reference production resources: {name}")


def _job_runners(message_delivery_adapter: str) -> dict[str, str]:
    if message_delivery_adapter == "resend-outbox":
        return {"outboxEmailDrain": "outbox-email-drain"}
    return {}
