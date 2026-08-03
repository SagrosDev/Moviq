from __future__ import annotations

from django.http import JsonResponse
from django.urls import path

from moviqo.jobs.health import run


def health_start(_request):
    return JsonResponse(run())


urlpatterns = [
    path("health/start/", health_start, name="health-start"),
]
