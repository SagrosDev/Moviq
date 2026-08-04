from __future__ import annotations

import os
from pathlib import Path

from moviqo.settings.env import env_bool, env_csv, required_env

BASE_DIR = Path(__file__).resolve().parents[3]

SECRET_KEY = required_env("MOVIQO_SECRET_KEY")
DEBUG = env_bool("MOVIQO_DEBUG", default=False)
ALLOWED_HOSTS = env_csv("MOVIQO_ALLOWED_HOSTS")

ROOT_URLCONF = "moviqo.urls"
ASGI_APPLICATION = "moviqo.asgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "organizations.MoviqoUser"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "drf_spectacular",
    "moviqo.modules.organizations.apps.OrganizationsConfig",
    "moviqo.modules.workflow_design.apps.WorkflowDesignConfig",
    "moviqo.modules.workflow_runtime.apps.WorkflowRuntimeConfig",
    "moviqo.modules.files.apps.FilesConfig",
    "moviqo.modules.messaging.apps.MessagingConfig",
    "moviqo.modules.governance.apps.GovernanceConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "moviqo.building_blocks.api.correlation.CorrelationIdMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": required_env("MOVIQO_DB_NAME"),
        "USER": required_env("MOVIQO_DB_USER"),
        "PASSWORD": required_env("MOVIQO_DB_PASSWORD"),
        "HOST": required_env("MOVIQO_DB_HOST"),
        "PORT": required_env("MOVIQO_DB_PORT"),
    }
}
MOVIQO_DB_RUNTIME_ROLE = os.getenv("MOVIQO_DB_RUNTIME_ROLE", "moviqo_runtime")
MOVIQO_DB_RUNTIME_MEMBER = os.getenv("MOVIQO_DB_RUNTIME_MEMBER", DATABASES["default"]["USER"])

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
MOVIQO_ENVIRONMENT_CLASS = os.getenv("MOVIQO_ENVIRONMENT_CLASS", "local-dev")
MOVIQO_BUILD_ID = os.getenv("MOVIQO_BUILD_ID", "local-build")
MOVIQO_SERVICE_CLASS = os.getenv("MOVIQO_SERVICE_CLASS", "application")
MOVIQO_SERVICE_NAME = os.getenv("MOVIQO_SERVICE_NAME", "moviqo-back")
MOVIQO_FILE_INSPECTION_ADAPTER = os.getenv("MOVIQO_FILE_INSPECTION_ADAPTER", "disabled")
MOVIQO_MESSAGE_DELIVERY_ADAPTER = os.getenv("MOVIQO_MESSAGE_DELIVERY_ADAPTER", "console")
MOVIQO_CACHE_POLICY = os.getenv("MOVIQO_CACHE_POLICY", "local")
MOVIQO_DISABLED_SERVICES = {
    "liveMalwareScanning": os.getenv("MOVIQO_LIVE_MALWARE_SCANNING", "disabled-by-gate"),
    "independentBackups": os.getenv("MOVIQO_INDEPENDENT_BACKUPS", "disabled-by-gate"),
    "lifecycleSchedules": os.getenv("MOVIQO_LIFECYCLE_SCHEDULES", "disabled-by-gate"),
}

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": (
        "moviqo.building_blocks.api.problem_details.problem_details_exception_handler"
    ),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Moviqo API",
    "VERSION": "0.1.0",
    "SCHEMA_PATH_PREFIX": r"/api/v1",
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "redact_uuid_request_paths": {
            "()": "moviqo.building_blocks.api.logging.RedactUuidRequestLogFilter",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "filters": ["redact_uuid_request_paths"],
        }
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        }
    },
}
