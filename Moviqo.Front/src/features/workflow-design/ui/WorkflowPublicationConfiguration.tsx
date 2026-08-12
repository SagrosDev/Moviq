import { useLanguage } from "../../../shared/localization";
import {
  Card,
  CheckboxField,
  FormGrid,
  FormGridItem,
  SelectField
} from "../../../shared/ui";
import type {
  WorkflowConfigurationDirectory,
  WorkflowDraftDocument,
  WorkflowStarterMode
} from "../model/types";

type WorkflowPublicationConfigurationProps = {
  configurationDirectory: WorkflowConfigurationDirectory;
  disabled: boolean;
  draft: WorkflowDraftDocument;
  onStarterMembership: (membershipId: string) => void;
  onStarterMode: (mode: WorkflowStarterMode) => void;
  onStarterTeam: (teamId: string) => void;
};

export const WorkflowPublicationConfiguration = ({
  configurationDirectory,
  disabled,
  draft,
  onStarterMembership,
  onStarterMode,
  onStarterTeam
}: WorkflowPublicationConfigurationProps) => {
  const { t } = useLanguage();
  const starter = draft.publication?.starter ?? {
    mode: "unconfigured" as const,
    teamIds: [],
    membershipIds: []
  };

  return (
    <Card labelledBy="workflow-publication-configuration-title">
      <div className="grid gap-moviqo-1">
        <h2 className="m-0 text-moviqo-heading font-semibold" id="workflow-publication-configuration-title">
          {t("workflowDesign.editor.publicationSetupTitle")}
        </h2>
        <p className="m-0 text-sm text-moviqo-ink-secondary">
          {t("workflowDesign.editor.publicationSetupBody")}
        </p>
      </div>
      <FormGrid>
        <FormGridItem span="full">
          <div className="grid gap-moviqo-3">
            <SelectField
              disabled={disabled}
              id="workflow-starter-mode"
              helpText={t("workflowDesign.editor.starterHelp")}
              label={t("workflowDesign.editor.starterSectionTitle")}
              options={[
                { value: "unconfigured", label: t("workflowDesign.editor.starterEmpty") },
                { value: "allActiveMembers", label: t("workflowDesign.editor.starterAllActiveMembers") },
                { value: "selectedTeams", label: t("workflowDesign.editor.starterSelectedTeams") },
                { value: "selectedMembers", label: t("workflowDesign.editor.starterSelectedMembers") }
              ]}
              value={starter.mode}
              onChange={(event) => onStarterMode(event.target.value as WorkflowStarterMode)}
            />
            {starter.mode === "selectedTeams" ? configurationDirectory.teams.map((team) => (
              <CheckboxField
                checked={starter.teamIds.includes(team.teamId)}
                disabled={disabled}
                id={`workflow-starter-team-${team.teamId}`}
                key={team.teamId}
                label={team.name}
                onChange={() => onStarterTeam(team.teamId)}
              />
            )) : null}
            {starter.mode === "selectedMembers" ? configurationDirectory.memberships.map((membership) => (
              <CheckboxField
                checked={starter.membershipIds.includes(membership.membershipId)}
                disabled={disabled}
                id={`workflow-starter-member-${membership.membershipId}`}
                key={membership.membershipId}
                label={membership.displayName}
                onChange={() => onStarterMembership(membership.membershipId)}
              />
            )) : null}
          </div>
        </FormGridItem>
      </FormGrid>
    </Card>
  );
};
