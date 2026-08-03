from __future__ import annotations

import os

import django
from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.handlers.asgi import ASGIHandler
from django.test import Client


def test_asgi_settings_and_custom_user_model() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "moviqo.settings.test")
    django.setup()

    assert settings.ASGI_APPLICATION == "moviqo.asgi.application"
    assert settings.AUTH_USER_MODEL == "organizations.MoviqoUser"
    assert get_user_model().__name__ == "MoviqoUser"
    assert apps.get_model("organizations", "MoviqoUser")

    from moviqo.asgi import application

    assert isinstance(application, ASGIHandler)


def test_health_start_endpoint_is_minimal() -> None:
    client = Client()

    response = client.get("/health/start/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
