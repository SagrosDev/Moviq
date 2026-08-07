from __future__ import annotations

from moviqo.settings.production import *  # noqa: F403
from moviqo.settings.uat_contract import load_uat_contract

_uat_contract = load_uat_contract()

MOVIQO_ENVIRONMENT_CLASS = _uat_contract["environment_class"]
MOVIQO_BUILD_ID = _uat_contract["build_id"]
MOVIQO_SERVICE_CLASS = _uat_contract["service_class"]
MOVIQO_SERVICE_NAME = _uat_contract["service_name"]
MOVIQO_CLOUD_PROJECT_ID = _uat_contract["cloud_project_id"]
MOVIQO_SYNTHETIC_VERIFICATION_API_KEY = _uat_contract["synthetic_verification_api_key"]
MOVIQO_DJANGO_SECRET_KEY_SECRET = _uat_contract["django_secret_key_secret"]
MOVIQO_DB_PASSWORD_SECRET = _uat_contract["database_password_secret"]
MOVIQO_RESEND_API_KEY_SECRET = _uat_contract["resend_api_key_secret"]
MOVIQO_GCS_PRIVATE_BUCKET = _uat_contract["gcs_private_bucket"]
MOVIQO_GCS_QUARANTINE_BUCKET = _uat_contract["gcs_quarantine_bucket"]
MOVIQO_GCS_CLEAN_BUCKET = _uat_contract["gcs_clean_bucket"]
MOVIQO_FILE_INSPECTION_ADAPTER = _uat_contract["file_inspection_adapter"]
MOVIQO_MESSAGE_DELIVERY_ADAPTER = _uat_contract["message_delivery_adapter"]
MOVIQO_CACHE_POLICY = _uat_contract["cache_policy"]
MOVIQO_DISABLED_SERVICES = _uat_contract["disabled_services"]
