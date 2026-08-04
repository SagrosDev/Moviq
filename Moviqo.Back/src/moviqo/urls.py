from __future__ import annotations

from django.http import JsonResponse
from django.urls import path
from drf_spectacular.renderers import OpenApiJsonRenderer
from drf_spectacular.views import SpectacularAPIView

from moviqo.building_blocks.api.views import SystemPingView
from moviqo.jobs.health import run
from moviqo.modules.organizations.application import (
    CsrfTokenView,
    CurrentSessionView,
    InitialRegistrationView,
    PasswordRecoveryView,
    PasswordResetView,
    ProtectedMembershipDetailView,
    RegistrationVerificationView,
    SignInView,
    SignOutView,
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
    path("api/v1/auth/csrf/", CsrfTokenView.as_view(), name="api-v1-auth-csrf"),
    path("api/v1/auth/sign-in/", SignInView.as_view(), name="api-v1-auth-sign-in"),
    path(
        "api/v1/auth/password-recovery/",
        PasswordRecoveryView.as_view(),
        name="api-v1-auth-password-recovery",
    ),
    path(
        "api/v1/auth/password-reset/",
        PasswordResetView.as_view(),
        name="api-v1-auth-password-reset",
    ),
    path("api/v1/auth/session/", CurrentSessionView.as_view(), name="api-v1-auth-session"),
    path("api/v1/auth/sign-out/", SignOutView.as_view(), name="api-v1-auth-sign-out"),
    path(
        "api/v1/organizations/registrations/",
        InitialRegistrationView.as_view(),
        name="api-v1-organizations-registration-create",
    ),
    path(
        "api/v1/organizations/registrations/verify-email/",
        RegistrationVerificationView.as_view(),
        name="api-v1-organizations-registration-verify-email",
    ),
    path(
        "api/v1/organizations/protected-memberships/<uuid:membership_id>/",
        ProtectedMembershipDetailView.as_view(),
        name="api-v1-organizations-protected-membership-detail",
    ),
]
