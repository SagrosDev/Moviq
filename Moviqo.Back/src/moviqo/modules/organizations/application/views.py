from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from moviqo.building_blocks.api.problem_details import ProblemDetailsSerializer
from moviqo.building_blocks.tenancy.runtime import apply_tenant_context, tenant_bootstrap_context
from moviqo.modules.organizations.application.tenant_access import resolve_tenant_context
from moviqo.modules.organizations.models import Membership


class ProtectedMembershipSerializer(serializers.Serializer):
    membershipId = serializers.UUIDField()
    organizationId = serializers.UUIDField()
    role = serializers.CharField()


class ProtectedMembershipDetailView(APIView):
    permission_classes = [IsAuthenticated]

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
                    organization_id=tenant_context.organization_id,
                )
                .first()
            )
            if membership is None:
                raise NotFound("membership")

            return Response(
                {
                    "membershipId": membership.id,
                    "organizationId": membership.organization_id,
                    "role": membership.role,
                }
            )
