from __future__ import annotations

from uuid import UUID

from rest_framework.exceptions import PermissionDenied, ValidationError

from moviqo.building_blocks.tenancy.runtime import TenantContext, require_authenticated_user
from moviqo.modules.organizations.models import Membership

ORGANIZATION_SELECTOR_HEADER = "HTTP_X_MOVIQO_ORGANIZATION_ID"


def resolve_tenant_context(request) -> TenantContext:
    user = request.user
    require_authenticated_user(user)

    selector_value = request.META.get(ORGANIZATION_SELECTOR_HEADER)
    memberships = Membership.objects.filter(user=user, is_active=True).order_by(
        "organization_id",
        "id",
    )

    if selector_value:
        try:
            selector_uuid = UUID(selector_value)
        except ValueError as exc:
            raise ValidationError({"organizationId": ["Invalid organization selector."]}) from exc
        memberships = memberships.filter(organization_id=selector_uuid)

    membership_rows = list(memberships.values_list("id", "organization_id"))
    if len(membership_rows) != 1:
        raise PermissionDenied("tenant context unavailable")

    membership_id, organization_id = membership_rows[0]
    return TenantContext(
        organization_id=organization_id,
        membership_id=membership_id,
        user_id=user.pk,
    )
