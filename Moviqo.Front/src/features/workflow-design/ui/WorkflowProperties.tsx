import { useState } from "react";
import { useLanguage } from "../../../shared/localization";
import { Alert, Badge, Button, Card, SelectField, TextInput } from "../../../shared/ui";
import type {
  WorkflowConfigurationDirectory,
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement
} from "../model/types";

type WorkflowPropertiesProps = {
  configurationDirectory: WorkflowConfigurationDirectory;
  draft: WorkflowDraftDocument;
  disabled: boolean;
  connectionRejected: boolean;
  selectedElement: WorkflowDraftElement | null;
  selectedConnection: WorkflowDraftConnection | null;
  onConnect: (sourceId: string, targetId: string) => void;
  onDesignTaskForm?: (taskElementId: string) => void;
  onRenameConnection: (connectionId: string, label: string) => void;
  onRenameTask: (elementId: string, label: string) => void;
};

export const WorkflowProperties = ({
  configurationDirectory,
  draft,
  disabled,
  connectionRejected,
  selectedElement,
  selectedConnection,
  onConnect,
  onDesignTaskForm,
  onRenameConnection,
  onRenameTask
}: WorkflowPropertiesProps) => {
  const { t } = useLanguage();
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const typeLabels = {
    start: t("workflowDesign.editor.startLabel"),
    task: t("workflowDesign.editor.taskLabel"),
    end: t("workflowDesign.editor.endLabel")
  };
  const elementLabel = (element: WorkflowDraftElement) =>
    element.type === "task" ? element.label : typeLabels[element.type];
  let taskOrdinal = 0;
  const elementOptions = [
    { value: "", label: t("workflowDesign.editor.connectionEmpty") },
    ...draft.elements.map((element) => {
      if (element.type !== "task") {
        return { value: element.id, label: elementLabel(element) };
      }
      taskOrdinal += 1;
      const taskName = element.label.trim() || t("workflowDesign.editor.unnamedTask");
      return {
        value: element.id,
        label: `${typeLabels.task} ${taskOrdinal} · ${taskName}`
      };
    })
  ];
  const assignment = draft.publication?.assignment;
  const assignedMember = configurationDirectory.memberships.find(
    (membership) => membership.membershipId === assignment?.membershipId
  );
  const taskHasForm = selectedElement?.type === "task"
    && draft.formBindings.some((binding) => binding.taskElementId === selectedElement.id);
  const selectedConnectionSource = draft.elements.find(
    (element) => element.id === selectedConnection?.sourceId
  );
  const selectedConnectionTarget = draft.elements.find(
    (element) => element.id === selectedConnection?.targetId
  );

  return (
    <Card labelledBy="workflow-properties-title">
      <div className="grid gap-moviqo-1">
        <h2 className="m-0 text-moviqo-heading font-semibold" id="workflow-properties-title">
          {t("workflowDesign.editor.propertiesTitle")}
        </h2>
        <p className="m-0 text-sm text-moviqo-ink-secondary">
          {t("workflowDesign.editor.propertiesBody")}
        </p>
      </div>
      {selectedElement ? (
        <div className="grid gap-moviqo-3">
          <div>
            {selectedElement.type === "task" ? (
              <TextInput
                disabled={disabled}
                errorMessage={selectedElement.label.trim()
                  ? undefined
                  : t("workflowDesign.editor.taskNameRequired")}
                helpText={t("workflowDesign.editor.taskNameHelp")}
                id="workflow-task-name"
                label={t("workflowDesign.editor.taskName")}
                required
                value={selectedElement.label}
                onChange={(event) => onRenameTask(selectedElement.id, event.target.value)}
              />
            ) : <strong>{typeLabels[selectedElement.type]}</strong>}
            <p className="m-0 text-sm text-moviqo-ink-secondary">
              {typeLabels[selectedElement.type]}
            </p>
          </div>
          {selectedElement.type === "task" ? (
            <div className="grid gap-moviqo-3">
              <p className="m-0 text-sm">
                {assignment?.mode === "workflowInitiator"
                  ? t("workflowDesign.editor.assignmentWorkflowInitiator")
                  : assignedMember?.displayName ?? t("workflowDesign.editor.assignmentEmpty")}
              </p>
              <Badge tone={taskHasForm ? "success" : "warning"}>
                {taskHasForm
                  ? t("workflowDesign.editor.formReady")
                  : t("workflowDesign.editor.formMissing")}
              </Badge>
              {onDesignTaskForm ? (
                <Button width="full" onClick={() => onDesignTaskForm(selectedElement.id)}>
                  {t("workflowDesign.editor.designForm")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : selectedConnection ? (
        <div className="grid gap-moviqo-3">
          <p className="m-0 text-sm text-moviqo-ink-secondary">
            {selectedConnectionSource ? elementLabel(selectedConnectionSource) : selectedConnection.sourceId}
            {" → "}
            {selectedConnectionTarget ? elementLabel(selectedConnectionTarget) : selectedConnection.targetId}
          </p>
          <TextInput
            disabled={disabled}
            helpText={t("workflowDesign.editor.connectionLabelHelp")}
            id="workflow-connection-label"
            label={t("workflowDesign.editor.connectionLabel")}
            value={selectedConnection.label ?? ""}
            onChange={(event) => onRenameConnection(selectedConnection.id, event.target.value)}
          />
        </div>
      ) : (
        <p className="m-0 text-sm text-moviqo-ink-secondary">
          {t("workflowDesign.editor.noSelection")}
        </p>
      )}
      <div className="grid gap-moviqo-3 border-t border-moviqo-border pt-moviqo-4">
        <h3 className="m-0 text-base font-semibold">
          {t("workflowDesign.editor.connectionTitle")}
        </h3>
        {connectionRejected ? (
          <Alert announcement="assertive" tone="error">
            {t("workflowDesign.editor.connectRejected")}
          </Alert>
        ) : null}
        <SelectField
          disabled={disabled}
          id="workflow-connection-source"
          label={t("workflowDesign.editor.connectionSource")}
          options={elementOptions}
          value={sourceId}
          onChange={(event) => setSourceId(event.target.value)}
        />
        <SelectField
          disabled={disabled}
          id="workflow-connection-target"
          label={t("workflowDesign.editor.connectionTarget")}
          options={elementOptions}
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
        />
        <Button
          disabled={disabled || !sourceId || !targetId}
          variant="secondary"
          width="full"
          onClick={() => onConnect(sourceId, targetId)}
        >
          {t("workflowDesign.editor.connectLabel")}
        </Button>
      </div>
    </Card>
  );
};
