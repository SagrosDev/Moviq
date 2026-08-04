from __future__ import annotations

import logging
from uuid import UUID

from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from moviqo.building_blocks.api.problem_details import (
    ProblemDetailsSerializer,
    ProblemTemplate,
    problem_response,
)
from moviqo.building_blocks.tenancy.runtime import apply_tenant_context, tenant_bootstrap_context
from moviqo.modules.organizations.application.password_policy import CredentialValidationError
from moviqo.modules.organizations.application.password_recovery import (
    PasswordRecoveryError,
    request_password_recovery,
    reset_password,
)
from moviqo.modules.organizations.application.registration import (
    RegistrationValidationError,
    VerificationActivationError,
    register_initial_owner,
    verify_initial_registration,
)
from moviqo.modules.organizations.application.session import (
    authenticate_session,
    end_session,
    session_context,
)
from moviqo.modules.organizations.application.tenant_access import resolve_tenant_context
from moviqo.modules.organizations.models import Membership, RegistrationWorkflowState

request_logger = logging.getLogger("django.request")


class AuthenticatedRequestPermission(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(getattr(request.user, "is_authenticated", False))


class SignInRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(max_length=128, trim_whitespace=False)


class SessionContextSerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    user = serializers.DictField()
    membership = serializers.DictField()


class CsrfTokenResponseSerializer(serializers.Serializer):
    csrfToken = serializers.CharField()


class EmptyRequestSerializer(serializers.Serializer):
    pass


class PasswordRecoveryRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class PasswordRecoveryResponseSerializer(serializers.Serializer):
    status = serializers.CharField()


class PasswordResetRequestSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=512, trim_whitespace=False)
    password = serializers.CharField(max_length=128, trim_whitespace=False)


@method_decorator(csrf_protect, name="dispatch")
class SignInView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        operation_id="organizations_sign_in",
        request=SignInRequestSerializer,
        responses={
            200: SessionContextSerializer,
            400: ProblemDetailsSerializer,
            401: ProblemDetailsSerializer,
        },
    )
    def post(self, request) -> Response:
        serializer = SignInRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(400, "authentication_failed", "Authentication failed"),
            )
        membership = authenticate_session(request=request, **serializer.validated_data)
        if membership is None:
            return problem_response(
                request,
                ProblemTemplate(401, "authentication_failed", "Authentication failed"),
            )
        return Response(session_context(request.user))


@method_decorator(csrf_protect, name="dispatch")
class PasswordRecoveryView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        operation_id="organizations_password_recovery",
        request=PasswordRecoveryRequestSerializer,
        responses={200: PasswordRecoveryResponseSerializer, 400: ProblemDetailsSerializer},
    )
    def post(self, request) -> Response:
        serializer = PasswordRecoveryRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(400, "recovery_invalid", "Recovery request failed"),
            )
        result = request_password_recovery(
            email=serializer.validated_data["email"],
            remote_address=request.META.get("REMOTE_ADDR", "unknown"),
            language=request.headers.get("Accept-Language", "es")[:2],
        )
        return Response({"status": result.status})


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        operation_id="organizations_password_reset",
        request=PasswordResetRequestSerializer,
        responses={
            200: PasswordRecoveryResponseSerializer,
            400: ProblemDetailsSerializer,
        },
    )
    def post(self, request) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid() or not serializer.validated_data.get("token", ""):
            return problem_response(
                request,
                ProblemTemplate(400, "password_reset_failed", "Password reset failed"),
            )
        language = request.headers.get("Accept-Language", "es")[:2]
        try:
            reset_password(
                token=serializer.validated_data["token"],
                password=serializer.validated_data["password"],
                language=language,
            )
        except CredentialValidationError as exc:
            return problem_response(
                request,
                ProblemTemplate(400, "password_invalid", "Password reset failed"),
                invalid_params=[
                    {"name": "password", "code": violation.code, "reason": violation.message}
                    for violation in exc.violations
                ],
            )
        except PasswordRecoveryError:
            return problem_response(
                request,
                ProblemTemplate(400, "password_reset_failed", "Password reset failed"),
            )
        return Response({"status": "password_reset"})


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        operation_id="organizations_csrf_token", responses={200: CsrfTokenResponseSerializer}
    )
    def get(self, request) -> Response:
        return Response({"csrfToken": get_token(request)})


class CurrentSessionView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="organizations_current_session", responses={200: SessionContextSerializer}
    )
    def get(self, request) -> Response:
        return Response(session_context(request.user))


@method_decorator(csrf_protect, name="dispatch")
class SignOutView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="organizations_sign_out",
        request=EmptyRequestSerializer,
        responses={204: OpenApiResponse(description="Session ended")},
    )
    def post(self, request) -> Response:
        end_session(request)
        return Response(status=204)


class ProtectedMembershipSerializer(serializers.Serializer):
    membershipId = serializers.UUIDField()
    organizationId = serializers.UUIDField()
    role = serializers.CharField()


class ProtectedMembershipDetailView(APIView):
    permission_classes = [AuthenticatedRequestPermission]

    @extend_schema(
        operation_id="organizations_protected_membership_detail",
        responses={
            200: ProtectedMembershipSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (404, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def get(self, request, membership_id: UUID) -> Response:
        with tenant_bootstrap_context(user_id=request.user.pk):
            tenant_context = resolve_tenant_context(request)
            apply_tenant_context(tenant_context)
            membership = (
                Membership.objects.select_related("organization")
                .filter(
                    id=membership_id,
                    is_active=True,
                    registration_state=RegistrationWorkflowState.ACTIVE,
                    organization_id=tenant_context.organization_id,
                    organization__is_active=True,
                    organization__registration_state=RegistrationWorkflowState.ACTIVE,
                )
                .first()
            )
            if membership is None:
                request_logger.warning(
                    "Protected membership resource hidden for current tenant path=%s",
                    request.path,
                )
                raise NotFound("membership")

            return Response(
                {
                    "membershipId": membership.id,
                    "organizationId": membership.organization_id,
                    "role": membership.role,
                }
            )


class InitialRegistrationRequestSerializer(serializers.Serializer):
    ownerName = serializers.CharField(max_length=120, allow_blank=True, required=False)
    organizationName = serializers.CharField(max_length=120, allow_blank=True, required=False)
    email = serializers.EmailField(max_length=254, allow_blank=True, required=False)
    password = serializers.CharField(
        max_length=128,
        trim_whitespace=False,
        allow_blank=True,
        required=False,
    )
    language = serializers.CharField(max_length=8, allow_blank=True, required=False)
    region = serializers.CharField(max_length=8, allow_blank=True, required=False)
    timezone = serializers.CharField(max_length=64, allow_blank=True, required=False)
    currency = serializers.CharField(max_length=8, allow_blank=True, required=False)
    termsAccepted = serializers.BooleanField(required=False)
    privacyAccepted = serializers.BooleanField(required=False)
    termsVersion = serializers.CharField(max_length=64, allow_blank=True, required=False)
    privacyVersion = serializers.CharField(max_length=64, allow_blank=True, required=False)
    prohibitedDataAcknowledged = serializers.BooleanField()


class InitialRegistrationResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    email = serializers.EmailField()
    language = serializers.CharField()


class RegistrationVerificationRequestSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=512, allow_blank=True, required=False)


class RegistrationVerificationResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    email = serializers.EmailField()
    language = serializers.CharField()
    nextStep = serializers.CharField()


class InitialRegistrationView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        operation_id="organizations_register_initial_owner",
        request=InitialRegistrationRequestSerializer,
        responses={
            201: InitialRegistrationResponseSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
            (409, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def post(self, request) -> Response:
        serializer = InitialRegistrationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="registration_invalid",
                    title="Registration failed",
                ),
                invalid_params=_registration_invalid_params(serializer.errors),
            )

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="registration_invalid",
                    title="Registration failed",
                ),
                invalid_params=[
                    {
                        "name": "idempotencyKey",
                        "code": "required",
                        "reason": "Provide an idempotency key to continue.",
                    }
                ],
            )

        try:
            result = register_initial_owner(
                owner_name=serializer.validated_data["ownerName"],
                organization_name=serializer.validated_data["organizationName"],
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                language=serializer.validated_data["language"],
                region=serializer.validated_data["region"],
                timezone=serializer.validated_data["timezone"],
                currency=serializer.validated_data["currency"],
                terms_accepted=serializer.validated_data["termsAccepted"],
                privacy_accepted=serializer.validated_data["privacyAccepted"],
                terms_version=serializer.validated_data["termsVersion"],
                privacy_version=serializer.validated_data["privacyVersion"],
                prohibited_data_acknowledged=serializer.validated_data[
                    "prohibitedDataAcknowledged"
                ],
                idempotency_key=idempotency_key,
            )
        except RegistrationValidationError as exc:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code=exc.problem_code,
                    title=exc.title,
                ),
                invalid_params=exc.invalid_params,
            )

        return Response(result, status=201)


class RegistrationVerificationView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        operation_id="organizations_verify_initial_registration",
        request=RegistrationVerificationRequestSerializer,
        responses={
            200: RegistrationVerificationResponseSerializer,
            (400, "application/problem+json"): OpenApiResponse(ProblemDetailsSerializer),
        },
    )
    def post(self, request) -> Response:
        serializer = RegistrationVerificationRequestSerializer(data=request.data)
        if not serializer.is_valid() or not serializer.validated_data.get("token", "").strip():
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code="verification_link_invalid",
                    title="Verification failed",
                ),
            )

        try:
            result = verify_initial_registration(
                token=serializer.validated_data["token"].strip()
            )
        except VerificationActivationError as exc:
            return problem_response(
                request,
                ProblemTemplate(
                    status_code=400,
                    code=exc.problem_code,
                    title=exc.title,
                ),
            )

        return Response(result, status=200)


def _registration_invalid_params(errors) -> list[dict[str, str]]:
    invalid_params: list[dict[str, str]] = []

    for field_name in (
        "ownerName",
        "organizationName",
        "email",
        "password",
        "language",
        "region",
        "timezone",
        "currency",
        "termsAccepted",
        "privacyAccepted",
        "termsVersion",
        "privacyVersion",
        "prohibitedDataAcknowledged",
    ):
        if field_name not in errors:
            continue

        invalid_params.append(
            {
                "name": field_name,
                "code": _registration_error_code(field_name),
                "reason": _registration_error_reason(field_name),
            }
        )

    if not invalid_params:
        invalid_params.append(
            {
                "name": "nonFieldErrors",
                "code": "invalid_request",
                "reason": "Correct the marked values and try again.",
            }
        )

    return invalid_params


def _registration_error_code(field_name: str) -> str:
    if field_name in {"email"}:
        return "invalid_email"
    if field_name in {"termsAccepted", "privacyAccepted", "termsVersion", "privacyVersion"}:
        return "consent_required"
    return "required"


def _registration_error_reason(field_name: str) -> str:
    if field_name == "email":
        return "Enter a valid email address."
    if field_name in {"termsAccepted", "privacyAccepted", "termsVersion", "privacyVersion"}:
        return "Complete the required acceptance to continue."
    return "Complete this field to continue."
