from __future__ import annotations

import ipaddress
from urllib.parse import urlparse

from moviqo.settings.env import env_bool, required_env, required_env_csv

PRODUCTION_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")


def load_production_security_contract(*, allowed_hosts: list[str]) -> dict[str, object]:
    contract = {
        "csrf_trusted_origins": required_env_csv("MOVIQO_CSRF_TRUSTED_ORIGINS"),
        "trust_proxy_ssl_header": env_bool("MOVIQO_TRUST_X_FORWARDED_PROTO", default=False),
        "gcs_private_bucket": required_env("MOVIQO_GCS_PRIVATE_BUCKET"),
        "gcs_quarantine_bucket": required_env("MOVIQO_GCS_QUARANTINE_BUCKET"),
        "gcs_clean_bucket": required_env("MOVIQO_GCS_CLEAN_BUCKET"),
        "resend_api_key": required_env("MOVIQO_RESEND_API_KEY"),
    }

    validate_production_security_settings(
        allowed_hosts=allowed_hosts,
        csrf_trusted_origins=contract["csrf_trusted_origins"],
        secure_proxy_ssl_header=(
            PRODUCTION_PROXY_SSL_HEADER if contract["trust_proxy_ssl_header"] else None
        ),
        secure_ssl_redirect=True,
        session_cookie_secure=True,
        csrf_cookie_secure=True,
    )
    _validate_private_bucket_name(contract["gcs_private_bucket"], "MOVIQO_GCS_PRIVATE_BUCKET")
    _validate_private_bucket_name(
        contract["gcs_quarantine_bucket"],
        "MOVIQO_GCS_QUARANTINE_BUCKET",
    )
    _validate_private_bucket_name(contract["gcs_clean_bucket"], "MOVIQO_GCS_CLEAN_BUCKET")
    return contract


def validate_production_security_settings(
    *,
    allowed_hosts: list[str],
    csrf_trusted_origins: list[str],
    secure_proxy_ssl_header: tuple[str, str] | None,
    secure_ssl_redirect: bool,
    session_cookie_secure: bool,
    csrf_cookie_secure: bool,
) -> None:
    if not allowed_hosts:
        raise RuntimeError("Production requires explicit MOVIQO_ALLOWED_HOSTS entries.")
    if "*" in allowed_hosts:
        raise RuntimeError("Production MOVIQO_ALLOWED_HOSTS must not contain '*'.")

    for host in allowed_hosts:
        if _is_localhost_or_loopback(host):
            raise RuntimeError("Production MOVIQO_ALLOWED_HOSTS must not trust localhost hosts.")

    if not csrf_trusted_origins:
        raise RuntimeError(
            "Production requires explicit MOVIQO_CSRF_TRUSTED_ORIGINS entries."
        )

    for origin in csrf_trusted_origins:
        parsed_origin = urlparse(origin)
        if parsed_origin.scheme != "https" or not parsed_origin.netloc:
            raise RuntimeError(
                "Production MOVIQO_CSRF_TRUSTED_ORIGINS must contain absolute HTTPS origins."
            )
        if parsed_origin.hostname is None:
            raise RuntimeError(
                "Production MOVIQO_CSRF_TRUSTED_ORIGINS must contain hostnames."
            )
        if _is_localhost_or_loopback(parsed_origin.hostname):
            raise RuntimeError(
                "Production MOVIQO_CSRF_TRUSTED_ORIGINS must not trust localhost origins."
            )
        if not any(
            _origin_host_matches_allowed_host(parsed_origin.hostname, allowed_host)
            for allowed_host in allowed_hosts
        ):
            raise RuntimeError(
                "Production MOVIQO_CSRF_TRUSTED_ORIGINS must match MOVIQO_ALLOWED_HOSTS."
            )

    if secure_proxy_ssl_header != PRODUCTION_PROXY_SSL_HEADER:
        raise RuntimeError(
            "Production must trust HTTPS only through HTTP_X_FORWARDED_PROTO=https."
        )
    if not secure_ssl_redirect:
        raise RuntimeError("Production must enable SECURE_SSL_REDIRECT.")
    if not session_cookie_secure:
        raise RuntimeError("Production must enable SESSION_COOKIE_SECURE.")
    if not csrf_cookie_secure:
        raise RuntimeError("Production must enable CSRF_COOKIE_SECURE.")


def _validate_private_bucket_name(value: str, env_name: str) -> None:
    normalized_value = value.lower()
    if "public" in normalized_value:
        raise RuntimeError(f"{env_name} must reference private-only storage.")


def _is_localhost_or_loopback(value: str) -> bool:
    normalized_value = value.strip().lower().strip("[]")
    if normalized_value == "localhost" or normalized_value.endswith(".localhost"):
        return True

    try:
        return ipaddress.ip_address(normalized_value).is_loopback
    except ValueError:
        return False


def _origin_host_matches_allowed_host(origin_host: str, allowed_host: str) -> bool:
    normalized_origin_host = origin_host.lower()
    normalized_allowed_host = allowed_host.lower().strip()

    if normalized_allowed_host.startswith("."):
        wildcard_suffix = normalized_allowed_host[1:]
        return normalized_origin_host == wildcard_suffix or normalized_origin_host.endswith(
            normalized_allowed_host
        )

    return normalized_origin_host == normalized_allowed_host
