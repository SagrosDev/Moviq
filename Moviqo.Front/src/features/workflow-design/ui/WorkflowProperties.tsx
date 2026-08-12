import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../shared/localization";
import { Alert, Badge, Button, Card, SelectField, TextInput } from "../../../shared/ui";
import type {
  WorkflowAssignmentMode,
  WorkflowConfigurationDirectory,
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement
} from "../model/types";

type WorkflowPropertiesProps = {
  configurationDirectory: WorkflowConfigurationDirectory;
  draft: WorkflowDraftDocument;
  disabled: boolean;
  selectedElement: WorkflowDraftElement | null;
  selectedConnection: WorkflowDraftConnection | null;
  onAssignmentMembership: (elementId: string, membershipId: string) => void;
  onAssignmentMode: (elementId: string, mode: WorkflowAssignmentMode) => void;
  onDesignTaskForm?: (taskElementId: string) => void;
  onRemoveElement: (elementId: string) => void;
  onRenameConnection: (connectionId: string, label: string) => void;
  onRenameTask: (elementId: string, label: string) => void;
};

export const WorkflowProperties = ({
  configurationDirectory,
  draft,
  disabled,
  selectedElement,
  selectedConnection,
  onAssignmentMembership,
  onAssignmentMode,
  onDesignTaskForm,
  onRemoveElement,
  onRenameConnection,
  onRenameTask
}: WorkflowPropertiesProps) => {
  const { t } = useLanguage();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const restoreDeleteTriggerRef = useRef(false);
  const typeLabels = {
    start: t("workflowDesign.editor.startLabel"),
    task: t("workflowDesign.editor.taskLabel"),
    end: t("workflowDesign.editor.endLabel")
  };
  const elementLabel = (element: WorkflowDraftElement) =>
    element.type === "task" ? element.label : typeLabels[element.type];
  const assignment = selectedElement?.type === "task"
    ? selectedElement.assignment
    : undefined;
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

  useEffect(() => {
    setDeleteConfirmationOpen(false);
  }, [selectedElement?.id]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (deleteConfirmationOpen) {
        document.getElementById("workflow-delete-element-confirm")?.focus();
        return;
      }
      if (!restoreDeleteTriggerRef.current) return;
      restoreDeleteTriggerRef.current = false;
      document.getElementById("workflow-delete-element-trigger")?.focus();
    });
  }, [deleteConfirmationOpen]);

  const cancelDeleteConfirmation = () => {
    restoreDeleteTriggerRef.current = true;
    setDeleteConfirmationOpen(false);
  };

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
              <SelectField
                disabled={disabled}
                helpText={t("workflowDesign.editor.taskAssignmentHelp")}
                id={`workflow-task-assignment-${selectedElement.id}`}
                label={t("workflowDesign.editor.taskAssignmentTitle")}
                options={[
                  { value: "unconfigured", label: t("workflowDesign.editor.assignmentEmpty") },
                  { value: "workflowInitiator", label: t("workflowDesign.editor.assignmentWorkflowInitiator") },
                  { value: "specificMember", label: t("workflowDesign.editor.assignmentSpecificMember") }
                ]}
                value={assignment?.mode ?? "unconfigured"}
                onChange={(event) => onAssignmentMode(
                  selectedElement.id,
                  event.target.value as WorkflowAssignmentMode
                )}
              />
              {assignment?.mode === "specificMember" ? (
                <SelectField
                  disabled={disabled}
                  id={`workflow-task-assignee-${selectedElement.id}`}
                  label={t("workflowDesign.editor.assignmentSpecificMember")}
                  options={[
                    { value: "", label: t("workflowDesign.editor.assignmentEmpty") },
                    ...configurationDirectory.memberships.map((membership) => ({
                      value: membership.membershipId,
                      label: membership.displayName
                    }))
                  ]}
                  value={assignedMember?.membershipId ?? ""}
                  onChange={(event) => onAssignmentMembership(
                    selectedElement.id,
                    event.target.value
                  )}
                />
              ) : null}
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
          {selectedElement.type !== "start" ? (
            deleteConfirmationOpen ? (
              <Alert announcement="assertive" title={t("workflowDesign.editor.deleteElementTitle")} tone="warning">
                <p className="m-0">{t("workflowDesign.editor.deleteElementBody")}</p>
                <div className="mt-moviqo-3 flex flex-wrap gap-moviqo-2">
                  <Button
                    disabled={disabled}
                    id="workflow-delete-element-confirm"
                    variant="destructive"
                    onClick={() => onRemoveElement(selectedElement.id)}
                  >
                    {t("workflowDesign.editor.deleteElementConfirm")}
                  </Button>
                  <Button variant="secondary" onClick={cancelDeleteConfirmation}>
                    {t("workflowDesign.editor.deleteElementCancel")}
                  </Button>
                </div>
              </Alert>
            ) : (
              <Button
                disabled={disabled}
                id="workflow-delete-element-trigger"
                variant="destructive"
                width="full"
                onClick={() => setDeleteConfirmationOpen(true)}
              >
                {t("workflowDesign.editor.deleteElement")}
              </Button>
            )
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
    </Card>
  );
};
