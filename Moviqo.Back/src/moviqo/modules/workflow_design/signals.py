from __future__ import annotations

from django.contrib.auth.signals import user_logged_out
from django.dispatch import receiver

from moviqo.building_blocks.tenancy.runtime import TenantContext, tenant_bootstrap_context
from moviqo.modules.organizations.application.session import active_membership_for_user
from moviqo.modules.workflow_design.application.form_authoring_leases import (
    release_session_form_authoring_leases,
)


@receiver(user_logged_out, dispatch_uid="workflow-design-release-form-authoring-leases")
def release_form_authoring_leases_on_logout(
    sender,
    request,
    user,
    **kwargs,
) -> None:
    del sender, kwargs
    session_key = getattr(getattr(request, "session", None), "session_key", None)
    if user is None:
        return
    with tenant_bootstrap_context(user_id=user.pk):
        membership = active_membership_for_user(user)
    if not session_key or membership is None:
        return
    release_session_form_authoring_leases(
        tenant_context=TenantContext(
            organization_id=membership.organization_id,
            membership_id=membership.id,
            user_id=user.pk,
        ),
        session_key=session_key,
    )
