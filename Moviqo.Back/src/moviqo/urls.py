from __future__ import annotations

from django.http import JsonResponse
from django.urls import path
from drf_spectacular.renderers import OpenApiJsonRenderer
from drf_spectacular.views import SpectacularAPIView

from moviqo.building_blocks.api.views import SystemPingView
from moviqo.jobs.health import run
from moviqo.modules.organizations.application import (
    InitialRegistrationView,
    ProtectedMembershipDetailView,
)


def health_start(_request):
    return JsonResponse(run())


urlpatterns = [
    path("health/start/", health_start, name="health-start"),
    path(
        "api/v1/schema/",
        SpectacularAPIView.as_view(renderer_classes=[OpenApiJsonRenderer]),
        name="api-v1-schema",
    ),
    path("api/v1/system/ping/", SystemPingView.as_view(), name="api-v1-system-ping"),
    path(
        "api/v1/organizations/registrations/",
        InitialRegistrationView.as_view(),
        name="api-v1-organizations-registration-create",
    ),
    path(
        "api/v1/organizations/protected-memberships/<uuid:membership_id>/",
        ProtectedMembershipDetailView.as_view(),
        name="api-v1-organizations-protected-membership-detail",
    ),
]
