from __future__ import annotations

from moviqo.settings.base import *  # noqa: F403
from moviqo.settings.env import required_env_csv
from moviqo.settings.security import (
    PRODUCTION_PROXY_SSL_HEADER,
    load_production_security_contract,
)

DEBUG = False
ALLOWED_HOSTS = required_env_csv("MOVIQO_ALLOWED_HOSTS")
_production_security_contract = load_production_security_contract(allowed_hosts=ALLOWED_HOSTS)
CSRF_TRUSTED_ORIGINS = _production_security_contract["csrf_trusted_origins"]
CSRF_COOKIE_SECURE = True
CSRF_USE_SESSIONS = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_NAME = "__session"
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = PRODUCTION_PROXY_SSL_HEADER
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
MOVIQO_GCS_PRIVATE_BUCKET = _production_security_contract["gcs_private_bucket"]
MOVIQO_GCS_QUARANTINE_BUCKET = _production_security_contract["gcs_quarantine_bucket"]
MOVIQO_GCS_CLEAN_BUCKET = _production_security_contract["gcs_clean_bucket"]
MOVIQO_RESEND_API_KEY = _production_security_contract["resend_api_key"]
