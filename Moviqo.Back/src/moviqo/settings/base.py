from __future__ import annotations

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

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"

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
