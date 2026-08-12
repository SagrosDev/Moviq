import { useEffect, useState, type PointerEvent } from "react";
import type { XYPosition } from "@xyflow/react";
import type { DraftState } from "../../../shared/drafts";
import { useLanguage } from "../../../shared/localization";
import { Alert, Button } from "../../../shared/ui";
import type {
  WorkflowCreationAccepted,
  WorkflowConfigurationDirectory,
  WorkflowDraftDocument,
  WorkflowElementType,
  WorkflowPublicationIssue
} from "../model/types";
import { useWorkflowDraftEditor } from "../model/useWorkflowDraftEditor";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { WorkflowEditorActionBar, WorkflowSaveStatus } from "./WorkflowEditorActions";
import { WorkflowElementPalette } from "./WorkflowElementPalette";
import { WorkflowProperties } from "./WorkflowProperties";
import { WorkflowPublicationChecklist } from "./WorkflowPublicationChecklist";
import { WorkflowPublicationConfiguration } from "./WorkflowPublicationConfiguration";

type WorkflowDraftEditorProps = {
  configurationDirectory: WorkflowConfigurationDirectory;
  draftState: DraftState<WorkflowDraftDocument>;
  onAccepted: (
    draftState: DraftState<WorkflowDraftDocument>,
    accepted: WorkflowCreationAccepted
  ) => void;
  onDesignTaskForm?: (taskElementId: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  saveRequestToken?: number;
};

export const WorkflowDraftEditor = ({
  configurationDirectory,
  draftState,
  onAccepted,
  onDesignTaskForm,
  onDirtyChange,
  saveRequestToken = 0
}: WorkflowDraftEditorProps) => {
  const { t } = useLanguage();
  const controller = useWorkflowDraftEditor({
    draftState,
    onAccepted,
    onDirtyChange,
    saveRequestToken
  });
  const [pointerElementType, setPointerElementType] = useState<WorkflowElementType | null>(null);
  const { state } = controller;
  const selectedElement = state.localDraft.elements.find(
    (element) => element.id === state.selectedElementId
  ) ?? null;
  const selectedConnection = state.localDraft.connections.find(
    (connection) => connection.id === state.selectedConnectionId
  ) ?? null;
  const firstInvalidTask = state.localDraft.elements.find(
    (element) => element.type === "task" && !element.label.trim()
  ) ?? null;
  const editingDisabled = state.saveStatus === "saving"
    || state.saveStatus === "retrying"
    || state.revisionRecoveryRequired
    || state.publicationStatus === "validating"
    || state.publishStatus === "publishing";
  const announcement = state.lastOperation?.status === "accepted"
    ? state.lastOperation.kind === "add"
      ? t("workflowDesign.editor.addAccepted")
      : t("workflowDesign.editor.connectAccepted")
    : state.lastOperation?.status === "rejected"
      ? state.lastOperation.kind === "add"
        ? t("workflowDesign.editor.addRejected")
        : t("workflowDesign.editor.connectRejected")
      : "";

  useEffect(() => {
    const targetId = state.focusedChecklistSection === "starter"
      ? "workflow-starter-mode"
      : state.focusedChecklistSection === "assignment"
        ? "workflow-assignment-mode"
        : state.focusedChecklistSection === "canvas" && !state.selectedElementId
          ? "workflow-canvas-title"
          : null;
    if (!targetId) return;
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!(target instanceof HTMLElement)) return;
      target.scrollIntoView({ block: "center", behavior: "auto" });
      target.focus();
    });
  }, [state.focusedChecklistSection, state.selectedElementId]);

  const addAtPosition = (elementType: WorkflowElementType, position?: XYPosition) => {
    controller.addElement(elementType, position);
  };

  const beginPointerAdd = (
    elementType: WorkflowElementType,
    event: PointerEvent
  ) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      setPointerElementType(elementType);
    }
  };

  const taskIdForIssue = (issue: WorkflowPublicationIssue) => {
    const element = issue.elementId
      ? state.localDraft.elements.find((candidate) => candidate.id === issue.elementId)
      : null;
    if (element?.type === "task") return element.id;
    const binding = issue.bindingId
      ? state.localDraft.formBindings.find((candidate) => candidate.id === issue.bindingId)
      : null;
    return binding?.taskElementId
      ?? state.localDraft.elements.find((candidate) => candidate.type === "task")?.id
      ?? null;
  };

  const handleIssue = (issue: WorkflowPublicationIssue) => {
    const isFormIssue = issue.target.startsWith("processFields.")
      || issue.target.startsWith("formBindings.")
      || issue.code.startsWith("first_task_form_")
      || issue.code.startsWith("first_task_binding_");
    const taskElementId = isFormIssue ? taskIdForIssue(issue) : null;
    if (taskElementId && onDesignTaskForm) {
      onDesignTaskForm(taskElementId);
      return;
    }
    controller.focusIssue(issue);
  };

  const handleInvalidTarget = (target: string) => {
    const elementId = target.startsWith("elements.")
      ? target.split(".")[1] ?? null
      : null;
    handleIssue({
      code: "draft_integrity",
      severity: "blocking",
      target,
      elementId,
      fieldId: null,
      bindingId: target.startsWith("formBindings.") ? target.split(".")[1] ?? null : null,
      message: "",
      actionLabel: ""
    });
  };

  return (
    <section className="grid gap-moviqo-5" aria-labelledby="workflow-editor-workspace-title">
      <h2 className="sr-only" id="workflow-editor-workspace-title">
        {t("workflowDesign.editor.title")}
      </h2>
      <p className="sr-only" aria-atomic="true" aria-live="polite">
        <span key={state.operationSequence}>{announcement}</span>
      </p>
      <WorkflowSaveStatus
        state={state}
        onReloadLatest={() => void controller.reloadLatest()}
        onReapplyChanges={controller.reapplyChanges}
        onInvalidTarget={handleInvalidTarget}
      />
      {firstInvalidTask ? (
        <Alert
          announcement="assertive"
          title={t("workflowDesign.editor.taskNameRequiredTitle")}
          tone="error"
        >
          <p>{t("workflowDesign.editor.taskNameRequired")}</p>
          <Button variant="secondary" onClick={() => controller.selectElement(firstInvalidTask.id)}>
            {t("workflowDesign.editor.reviewTaskName")}
          </Button>
        </Alert>
      ) : null}
      <div className="grid items-start gap-moviqo-4 desktop:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="grid gap-moviqo-4">
          <WorkflowElementPalette
            disabled={editingDisabled}
            hasStart={state.localDraft.elements.some((element) => element.type === "start")}
            rejected={state.lastOperation?.kind === "add" && state.lastOperation.status === "rejected"}
            onAdd={addAtPosition}
            onPointerStart={beginPointerAdd}
          />
          <WorkflowProperties
            configurationDirectory={configurationDirectory}
            connectionRejected={state.lastOperation?.kind === "connect"
              && state.lastOperation.status === "rejected"}
            disabled={editingDisabled}
            draft={state.localDraft}
            selectedConnection={selectedConnection}
            selectedElement={selectedElement}
            onConnect={controller.connect}
            onDesignTaskForm={onDesignTaskForm}
            onRenameConnection={controller.renameConnection}
            onRenameTask={controller.renameTask}
          />
        </div>
        <WorkflowCanvas
          disabled={editingDisabled}
          draft={state.localDraft}
          pointerElementType={pointerElementType}
          positions={state.presentationPositions}
          selectedConnectionId={state.selectedConnectionId}
          selectedElementId={state.selectedElementId}
          onAddAtPosition={addAtPosition}
          onConnect={controller.connect}
          onPointerElementHandled={() => setPointerElementType(null)}
          onPosition={controller.positionElement}
          onSelect={controller.selectElement}
          onSelectConnection={controller.selectConnection}
        />
      </div>
      <div className="grid items-start gap-moviqo-4 desktop:grid-cols-2">
        <WorkflowPublicationConfiguration
          configurationDirectory={configurationDirectory}
          disabled={editingDisabled}
          draft={state.localDraft}
          onAssignmentMembership={controller.selectAssignmentMembership}
          onAssignmentMode={controller.selectAssignmentMode}
          onStarterMembership={controller.toggleStarterMembership}
          onStarterMode={controller.selectStarterMode}
          onStarterTeam={controller.toggleStarterTeam}
        />
        <WorkflowPublicationChecklist
          error={state.publicationStatus === "error"}
          issues={state.publicationIssues}
          validated={state.publicationStatus === "success"}
          onIssue={handleIssue}
        />
      </div>
      <WorkflowEditorActionBar
        state={state}
        onPublish={() => void controller.publish()}
        onRetrySave={() => void controller.saveDraft(true)}
        onSave={() => void controller.saveDraft(false)}
        onValidate={() => void controller.validatePublication()}
      />
    </section>
  );
};
