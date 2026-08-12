from __future__ import annotations

import pytest

from moviqo.building_blocks.tenancy.runtime import TenantContext
from moviqo.modules.organizations.models import (
    Membership,
    MembershipRole,
    Organization,
    Team,
    TeamMembership,
)
from moviqo.modules.workflow_design.application.publication_configuration import (
    evaluate_workflow_starter_authorization,
    validate_publication_configuration,
)


@pytest.fixture
def organization_directory(django_user_model):
    user = django_user_model.objects.create_user(
        username="designer",
        email="designer@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Designer",
    )
    teammate = django_user_model.objects.create_user(
        username="teammate",
        email="teammate@example.com",
        password="a-secure-password-123",
        is_active=True,
        display_name="Teammate",
    )
    organization = Organization.objects.create(
        slug="workflow-publication-org",
        display_name="Workflow Publication Org",
    )
    membership = Membership.objects.create(
        organization=organization,
        user=user,
        role=MembershipRole.DESIGNER,
    )
    teammate_membership = Membership.objects.create(
        organization=organization,
        user=teammate,
        role=MembershipRole.MEMBER,
    )
    team = Team.objects.create(
        organization=organization,
        name="Operations",
        normalized_name="operations",
    )
    TeamMembership.objects.create(
        organization=organization,
        team=team,
        membership=teammate_membership,
    )
    tenant_context = TenantContext(
        organization_id=organization.id,
        membership_id=membership.id,
        user_id=user.id,
    )
    return tenant_context, membership, teammate_membership, team


@pytest.mark.django_db
def test_publication_configuration_accepts_combined_team_and_member_starters(
    organization_directory,
) -> None:
    tenant_context, _membership, teammate_membership, team = organization_directory

    issues = validate_publication_configuration(
        tenant_context=tenant_context,
        document={
            "publication": {
                "starter": {
                    "mode": "selectedTeams",
                    "teamIds": [str(team.id)],
                    "membershipIds": [str(teammate_membership.id)],
                },
            },
        },
    )

    assert issues == []


def test_starter_authorization_accepts_team_or_direct_membership() -> None:
    publication = {
        "starter": {
            "mode": "selectedMembers",
            "teamIds": ["team-1"],
            "membershipIds": ["membership-1"],
        }
    }

    direct = evaluate_workflow_starter_authorization(
        publication=publication,
        membership_id="membership-1",
        membership_role="member",
        active_team_ids=set(),
    )
    via_team = evaluate_workflow_starter_authorization(
        publication=publication,
        membership_id="membership-2",
        membership_role="member",
        active_team_ids={"team-1"},
    )

    assert direct.allowed is True
    assert direct.via_operational_authority is False
    assert via_team.allowed is True
    assert via_team.via_operational_authority is False
