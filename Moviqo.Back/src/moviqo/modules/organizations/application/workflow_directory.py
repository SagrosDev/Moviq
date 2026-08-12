from __future__ import annotations

from dataclasses import dataclass

from django.db.models import Count, Q

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.organizations.models import (
    Membership,
    RegistrationWorkflowState,
    Team,
    TeamMembership,
)


@dataclass(frozen=True)
class WorkflowDesignMembershipOption:
    membership_id: str
    display_name: str
    email: str
    role: str


@dataclass(frozen=True)
class WorkflowDesignTeamOption:
    team_id: str
    name: str
    active_member_count: int
    membership_ids: tuple[str, ...]


@dataclass(frozen=True)
class WorkflowDesignDirectory:
    memberships: tuple[WorkflowDesignMembershipOption, ...]
    teams: tuple[WorkflowDesignTeamOption, ...]


def workflow_design_directory(
    *,
    tenant_context: TenantContext,
) -> WorkflowDesignDirectory:
    memberships = tuple(
        WorkflowDesignMembershipOption(
            membership_id=str(membership.id),
            display_name=membership.user.display_name or membership.user.username,
            email=membership.user.normalized_email,
            role=membership.role,
        )
        for membership in Membership.objects.select_related("user")
        .filter(
            organization_id=tenant_context.organization_id,
            is_active=True,
            registration_state=RegistrationWorkflowState.ACTIVE,
            user__is_active=True,
            organization__is_active=True,
            organization__registration_state=RegistrationWorkflowState.ACTIVE,
        )
        .order_by("user__display_name", "user__username", "id")
    )
    normalized_teams: list[WorkflowDesignTeamOption] = []
    for team in (
        Team.objects.filter(
            organization_id=tenant_context.organization_id,
            is_active=True,
        )
        .annotate(
            active_member_count=Count(
                "memberships",
                filter=Q(
                    memberships__is_active=True,
                    memberships__membership__is_active=True,
                    memberships__membership__registration_state=RegistrationWorkflowState.ACTIVE,
                    memberships__membership__user__is_active=True,
                ),
                distinct=True,
            )
        )
        .order_by("name", "id")
    ):
        membership_ids = tuple(
            str(team_membership.membership_id)
            for team_membership in TeamMembership.objects.select_related("membership")
            .filter(
                team_id=team.id,
                organization_id=tenant_context.organization_id,
                is_active=True,
                membership__is_active=True,
                membership__registration_state=RegistrationWorkflowState.ACTIVE,
                membership__user__is_active=True,
            )
            .order_by("membership_id")
        )
        normalized_teams.append(
            WorkflowDesignTeamOption(
                team_id=str(team.id),
                name=team.name,
                active_member_count=len(membership_ids),
                membership_ids=membership_ids,
            )
        )

    return WorkflowDesignDirectory(
        memberships=memberships,
        teams=tuple(
            team for team in normalized_teams if team.active_member_count > 0
        ),
    )
