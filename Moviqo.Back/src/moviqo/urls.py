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
    SyntheticJourneyRotationView,
    SyntheticJourneyRunView,
    SyntheticVerificationLinkView,
)
from moviqo.modules.workflow_design.application import (
    FormAuthoringLeaseView,
    FormDraftSaveView,
    WorkflowCollectionView,
    WorkflowDraftDetailView,
    WorkflowPublicationValidationView,
    WorkflowPublishView,
)
from moviqo.modules.workflow_runtime.application import (
    MyWorkDashboardView,
    ProcessDetailView,
    StartWorkflowProcessView,
    TaskFormCompletionView,
    TaskFormDetailView,
)


def health_start(_request):
    return JsonResponse(run())


urlpatterns = [
    path("health/start/", health_start, name="health-start"),
    path("api/v1/health/start/", health_start, name="api-v1-health-start"),
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
    path("api/v1/my-work/", MyWorkDashboardView.as_view(), name="api-v1-my-work-dashboard"),
    path(
        "api/v1/my-work/start-workflows/<uuid:workflow_id>/start/",
        StartWorkflowProcessView.as_view(),
        name="api-v1-my-work-start-workflow",
    ),
    path(
        "api/v1/my-work/tasks/<uuid:task_id>/form/",
        TaskFormDetailView.as_view(),
        name="api-v1-my-work-task-form-detail",
    ),
    path(
        "api/v1/my-work/tasks/<uuid:task_id>/complete/",
        TaskFormCompletionView.as_view(),
        name="api-v1-my-work-task-form-complete",
    ),
    path(
        "api/v1/my-work/processes/<uuid:process_id>/",
        ProcessDetailView.as_view(),
        name="api-v1-my-work-process-detail",
    ),
    path(
        "api/v1/workflow-design/workflows/",
        WorkflowCollectionView.as_view(),
        name="api-v1-workflow-design-workflow-collection",
    ),
    path(
        "api/v1/workflow-design/workflows/<uuid:workflow_id>/draft/",
        WorkflowDraftDetailView.as_view(),
        name="api-v1-workflow-design-draft-detail",
    ),
    path(
        "api/v1/workflow-design/workflows/<uuid:workflow_id>/tasks/"
        "<str:task_element_id>/form-authoring-lease/",
        FormAuthoringLeaseView.as_view(),
        name="api-v1-workflow-design-form-authoring-lease",
    ),
    path(
        "api/v1/workflow-design/workflows/<uuid:workflow_id>/tasks/"
        "<str:task_element_id>/form-draft/",
        FormDraftSaveView.as_view(),
        name="api-v1-workflow-design-form-draft-save",
    ),
    path(
        "api/v1/workflow-design/workflows/<uuid:workflow_id>/publication-validation/",
        WorkflowPublicationValidationView.as_view(),
        name="api-v1-workflow-design-publication-validation",
    ),
    path(
        "api/v1/workflow-design/workflows/<uuid:workflow_id>/publish/",
        WorkflowPublishView.as_view(),
        name="api-v1-workflow-design-publish",
    ),
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
        "api/v1/organizations/testing/synthetic-runs/",
        SyntheticJourneyRunView.as_view(),
        name="api-v1-organizations-synthetic-journey-run",
    ),
    path(
        "api/v1/organizations/testing/synthetic-runs/verification-link/",
        SyntheticVerificationLinkView.as_view(),
        name="api-v1-organizations-synthetic-verification-link",
    ),
    path(
        "api/v1/organizations/testing/synthetic-runs/rotate/",
        SyntheticJourneyRotationView.as_view(),
        name="api-v1-organizations-synthetic-journey-rotation",
    ),
    path(
        "api/v1/organizations/protected-memberships/<uuid:membership_id>/",
        ProtectedMembershipDetailView.as_view(),
        name="api-v1-organizations-protected-membership-detail",
    ),
]
