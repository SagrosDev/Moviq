from __future__ import annotations

from rest_framework.exceptions import PermissionDenied

from moviqo.building_blocks.tenancy.runtime import TenantContext, require_authenticated_user
from moviqo.modules.organizations.models import Membership, RegistrationWorkflowState


def resolve_tenant_context(request) -> TenantContext:
    user = request.user
    require_authenticated_user(user)

    memberships = Membership.objects.filter(
        user=user,
        is_active=True,
        registration_state=RegistrationWorkflowState.ACTIVE,
    ).order_by("organization_id", "id")

    membership_rows = list(memberships.values_list("id", "organization_id"))
    if len(membership_rows) != 1:
        raise PermissionDenied("tenant context unavailable")

    membership_id, organization_id = membership_rows[0]
    return TenantContext(
        organization_id=organization_id,
        membership_id=membership_id,
        user_id=user.pk,
    )
