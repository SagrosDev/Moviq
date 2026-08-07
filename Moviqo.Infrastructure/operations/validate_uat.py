from __future__ import annotations

from fnmatch import fnmatchcase
import json
from pathlib import Path
import re
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DISABLED_BY_GATE = "disabled-by-gate"
PRODUCTION_KEYWORDS = ("prod", "production")


def main() -> None:
    firebase = _load_json(ROOT / "firebase.json")
    uat_environment = _load_json(ROOT / "environments" / "uat" / "uat-environment.json")
    cloud_run_service = _load_json(ROOT / "modules" / "cloud-run-service.json")
    cloud_run_job = _load_json(ROOT / "modules" / "cloud-run-job.json")

    _validate_firebase(firebase)
    _validate_uat_environment(uat_environment)
    _validate_cloud_run_service(cloud_run_service, uat_environment)
    _validate_cloud_run_job(cloud_run_job, uat_environment)
    _validate_identity_separation(uat_environment, cloud_run_service, cloud_run_job)

    print("Moviqo UAT infrastructure contract is valid.")


def _validate_firebase(firebase: dict[str, object]) -> None:
    hosting = firebase["hosting"]
    rewrites = hosting["rewrites"]
    api_rewrite = next(
        (entry for entry in rewrites if entry.get("source") == "/api/**"),
        None,
    )
    if api_rewrite is None:
        raise RuntimeError("firebase.json must rewrite /api/** to Cloud Run.")
    if api_rewrite["run"]["serviceId"] != "moviqo-back-uat":
        raise RuntimeError("firebase.json must target the moviqo-back-uat service.")
    if api_rewrite["run"]["region"] != "us-east1":
        raise RuntimeError("firebase.json must target Cloud Run in us-east1.")

    for path in ("/", "/my-work", "/design-system", "/api/v1/health"):
        cache_policy = _match_header_value(hosting["headers"], path, "Cache-Control")
        if cache_policy != "no-store, max-age=0":
            raise RuntimeError(f"firebase.json must prevent CDN caching for {path}.")

    asset_policy = _match_header_value(hosting["headers"], "/assets/app.hash.js", "Cache-Control")
    if asset_policy != "public, max-age=31536000, immutable":
        raise RuntimeError("firebase.json must keep immutable hashed assets cacheable.")

    landing_policy = _match_header_value(hosting["headers"], "/landing/index.html", "Cache-Control")
    if landing_policy != "public, max-age=300":
        raise RuntimeError("firebase.json must keep public landing content on bounded caching.")


def _validate_uat_environment(uat_environment: dict[str, object]) -> None:
    if uat_environment["environmentClass"] != "synthetic-only":
        raise RuntimeError("UAT environmentClass must be synthetic-only.")
    if uat_environment["region"] != "us-east1":
        raise RuntimeError("UAT region must be us-east1.")
    if not uat_environment["routing"]["allowedHosts"]:
        raise RuntimeError("UAT must declare explicit allowed hosts.")
    if not uat_environment["routing"]["csrfTrustedOrigins"]:
        raise RuntimeError("UAT must declare explicit CSRF trusted origins.")
    if uat_environment["routing"]["trustXForwardedProto"] is not True:
        raise RuntimeError("UAT must trust HTTPS through X-Forwarded-Proto only.")
    if uat_environment["storage"]["publicAccess"] is not False:
        raise RuntimeError("UAT storage must remain private.")
    if uat_environment["storage"]["encryptionAtRest"] is not True:
        raise RuntimeError("UAT storage must keep encryption at rest enabled.")
    if uat_environment["database"]["encryptionAtRest"] is not True:
        raise RuntimeError("UAT database must keep encryption at rest enabled.")
    if uat_environment["fileInspection"]["adapter"] != "synthetic":
        raise RuntimeError("UAT file inspection must use the synthetic adapter.")

    disabled_services = uat_environment["disabledServices"]
    for service_name, status in disabled_services.items():
        if status != DISABLED_BY_GATE:
            raise RuntimeError(f"Disabled service {service_name} must be {DISABLED_BY_GATE!r}.")

    for value in (
        uat_environment["identity"]["cloudProjectId"],
        uat_environment["storage"]["privateBucket"],
        uat_environment["storage"]["quarantineBucket"],
        uat_environment["storage"]["cleanBucket"],
        uat_environment["database"]["host"],
        uat_environment["database"]["runtimeCredentialSecret"],
        uat_environment["database"]["migrationCredentialSecret"],
        uat_environment["messaging"]["apiKeySecret"],
    ):
        _assert_non_production_identifier(value)
    for host in uat_environment["routing"]["allowedHosts"]:
        _assert_non_production_identifier(host)
    for origin in uat_environment["routing"]["csrfTrustedOrigins"]:
        parsed_origin = urlparse(origin)
        if not parsed_origin.hostname:
            raise RuntimeError("UAT CSRF trusted origins must contain hostnames.")
        _assert_non_production_identifier(parsed_origin.hostname)

    cloud_run_scaling = uat_environment["scaling"]["cloudRun"]
    if cloud_run_scaling["minInstances"] != 0:
        raise RuntimeError("UAT Cloud Run must allow scale-to-zero.")
    if cloud_run_scaling["maxInstances"] > 2:
        raise RuntimeError("UAT Cloud Run maxInstances exceeds the approved low-cost cap.")

    for alert_name, thresholds in uat_environment["capacityAlerts"].items():
        if thresholds != [60, 80, 90]:
            raise RuntimeError(f"{alert_name} must use 60/80/90 percent thresholds.")


def _validate_cloud_run_service(
    cloud_run_service: dict[str, object], uat_environment: dict[str, object]
) -> None:
    if cloud_run_service["region"] != "us-east1":
        raise RuntimeError("Cloud Run module must target us-east1.")
    if cloud_run_service["minInstances"] != 0 or cloud_run_service["maxInstances"] > 2:
        raise RuntimeError("Cloud Run scaling must stay within the UAT low-cost cap.")
    if cloud_run_service["env"]["MOVIQO_ENVIRONMENT_CLASS"] != "synthetic-only":
        raise RuntimeError("Cloud Run must export MOVIQO_ENVIRONMENT_CLASS=synthetic-only.")
    if (
        cloud_run_service["env"]["MOVIQO_ALLOWED_HOSTS"]
        != ",".join(uat_environment["routing"]["allowedHosts"])
    ):
        raise RuntimeError("Cloud Run must export the declared UAT allowed hosts.")
    if (
        cloud_run_service["env"]["MOVIQO_CSRF_TRUSTED_ORIGINS"]
        != ",".join(uat_environment["routing"]["csrfTrustedOrigins"])
    ):
        raise RuntimeError("Cloud Run must export the declared UAT CSRF trusted origins.")
    if cloud_run_service["env"]["MOVIQO_TRUST_X_FORWARDED_PROTO"] != "true":
        raise RuntimeError("Cloud Run must trust HTTPS only through X-Forwarded-Proto.")
    if (
        cloud_run_service["env"]["MOVIQO_GCS_PRIVATE_BUCKET"]
        != uat_environment["storage"]["privateBucket"]
    ):
        raise RuntimeError("Cloud Run must export the declared UAT private bucket.")
    if (
        cloud_run_service["env"]["MOVIQO_GCS_QUARANTINE_BUCKET"]
        != uat_environment["storage"]["quarantineBucket"]
    ):
        raise RuntimeError("Cloud Run must export the declared UAT quarantine bucket.")
    if (
        cloud_run_service["env"]["MOVIQO_GCS_CLEAN_BUCKET"]
        != uat_environment["storage"]["cleanBucket"]
    ):
        raise RuntimeError("Cloud Run must export the declared UAT clean bucket.")
    if cloud_run_service["env"]["MOVIQO_FILE_INSPECTION_ADAPTER"] != "synthetic":
        raise RuntimeError("Cloud Run must use the synthetic file inspection adapter.")
    if cloud_run_service["env"]["MOVIQO_MESSAGE_DELIVERY_ADAPTER"] != "resend-outbox":
        raise RuntimeError("Cloud Run must use the Resend outbox adapter.")
    if (
        cloud_run_service["serviceAccount"]
        != uat_environment["identity"]["cloudRunServiceAccount"]
    ):
        raise RuntimeError("Cloud Run service must use the declared UAT service identity.")
    service_env = cloud_run_service["env"]
    for env_name in ("MOVIQO_SECRET_KEY", "MOVIQO_DB_PASSWORD", "MOVIQO_RESEND_API_KEY"):
        if env_name in service_env:
            raise RuntimeError(f"Cloud Run must not inline the secret value for {env_name}.")
    if "MOVIQO_SYNTHETIC_VERIFICATION_API_KEY" in service_env:
        raise RuntimeError(
            "Cloud Run must not inline the secret value for MOVIQO_SYNTHETIC_VERIFICATION_API_KEY."
        )

    secret_bindings = {
        binding["env"]: binding["secret"] for binding in cloud_run_service["secretEnv"]
    }
    required_secret_bindings = {
        "MOVIQO_SECRET_KEY": "moviqo-uat-django-secret",
        "MOVIQO_DB_PASSWORD": "moviqo-uat-db-password",
        "MOVIQO_RESEND_API_KEY": "moviqo-uat-resend-api-key",
        "MOVIQO_SYNTHETIC_VERIFICATION_API_KEY": "moviqo-uat-synthetic-verification-api-key",
    }
    for env_name, secret_name in required_secret_bindings.items():
        if secret_bindings.get(env_name) != secret_name:
            raise RuntimeError(
                f"Cloud Run must inject {env_name} from the {secret_name} secret."
            )
        _assert_non_production_identifier(secret_name)
    unexpected_secret_bindings = set(secret_bindings) - set(required_secret_bindings)
    if unexpected_secret_bindings:
        raise RuntimeError(
            "Cloud Run secretEnv contains undeclared runtime secrets: "
            f"{sorted(unexpected_secret_bindings)}"
        )


def _validate_cloud_run_job(
    cloud_run_job: dict[str, object], uat_environment: dict[str, object]
) -> None:
    if cloud_run_job["region"] != "us-east1":
        raise RuntimeError("Cloud Run job module must target us-east1.")
    if cloud_run_job["serviceClass"] != "uat-internal":
        raise RuntimeError("Cloud Run job must declare the UAT service class.")
    if cloud_run_job["maxRetries"] != 0:
        raise RuntimeError("Cloud Run job retries must stay disabled in UAT.")
    if cloud_run_job["maxConcurrentExecutions"] != 1:
        raise RuntimeError("Cloud Run job concurrency must stay within the UAT cap.")
    if cloud_run_job["serviceAccount"] != uat_environment["identity"]["cloudRunJobServiceAccount"]:
        raise RuntimeError("Cloud Run job must use the declared UAT job identity.")
    _assert_non_production_identifier(cloud_run_job["serviceAccount"])
    _validate_runtime_secret_wiring(
        runtime_name="Cloud Run job",
        env=cloud_run_job.get("env", {}),
        secret_env=cloud_run_job.get("secretEnv", []),
        required_secret_bindings={},
    )


def _validate_identity_separation(
    uat_environment: dict[str, object],
    cloud_run_service: dict[str, object],
    cloud_run_job: dict[str, object],
) -> None:
    service_identity = uat_environment["identity"]["cloudRunServiceAccount"]
    job_identity = uat_environment["identity"]["cloudRunJobServiceAccount"]
    if service_identity == job_identity:
        raise RuntimeError("UAT must use distinct Cloud Run service and job identities.")
    if cloud_run_service["serviceAccount"] == cloud_run_job["serviceAccount"]:
        raise RuntimeError("Cloud Run service and job must not share the same identity.")


def _assert_non_production_identifier(value: str) -> None:
    normalized = value.lower()
    if any(keyword in normalized for keyword in PRODUCTION_KEYWORDS):
        raise RuntimeError(f"UAT contract references a production-like identifier: {value}")


def _validate_runtime_secret_wiring(
    *,
    runtime_name: str,
    env: dict[str, object],
    secret_env: list[dict[str, object]],
    required_secret_bindings: dict[str, str],
) -> None:
    for env_name in (
        "MOVIQO_SECRET_KEY",
        "MOVIQO_DB_PASSWORD",
        "MOVIQO_RESEND_API_KEY",
        "MOVIQO_SYNTHETIC_VERIFICATION_API_KEY",
    ):
        if env_name in env:
            raise RuntimeError(f"{runtime_name} must not inline the secret value for {env_name}.")

    secret_bindings = {binding["env"]: binding["secret"] for binding in secret_env}
    for env_name, secret_name in required_secret_bindings.items():
        if secret_bindings.get(env_name) != secret_name:
            raise RuntimeError(
                f"{runtime_name} must inject {env_name} from the {secret_name} secret."
            )
        _assert_non_production_identifier(secret_name)

    unexpected_secret_bindings = set(secret_bindings) - set(required_secret_bindings)
    if unexpected_secret_bindings:
        raise RuntimeError(
            f"{runtime_name} secretEnv contains undeclared runtime secrets: "
            f"{sorted(unexpected_secret_bindings)}"
        )


def _match_header_value(
    header_rules: list[dict[str, object]], path: str, key: str
) -> str | None:
    value = None
    for rule in header_rules:
        if _rule_matches_path(rule, path):
            for header in rule["headers"]:
                if header["key"] == key:
                    value = header["value"]
    return value


def _rule_matches_path(rule: dict[str, object], path: str) -> bool:
    source = rule.get("source")
    if source is not None:
        return fnmatchcase(path, source)

    regex = rule.get("regex")
    if regex is not None:
        return re.match(regex, path) is not None

    return False


def _load_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
