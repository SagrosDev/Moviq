from __future__ import annotations

from django.http import JsonResponse
from django.urls import path

from moviqo.modules.organizations.application import module_health


def health_start(_request):
    module_health()
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/start/", health_start, name="health-start"),
]
