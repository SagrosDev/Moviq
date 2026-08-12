import { useEffect, useRef } from "react";
import { useLanguage } from "../../../shared/localization";
import { ActionBar, Alert, Badge, Button, Card, ErrorSummary } from "../../../shared/ui";
import {
  canPublishWorkflow,
  hasInvalidWorkflowTaskLabels,
  type WorkflowDraftEditorState
} from "../model/editor";

type WorkflowSaveStatusProps = {
  state: WorkflowDraftEditorState;
  onReapplyChanges: () => void;
  onReloadLatest: () => void;
  onInvalidTarget: (target: string) => void;
};

export const WorkflowSaveStatus = ({
  state,
  onReapplyChanges,
  onReloadLatest,
  onInvalidTarget
}: WorkflowSaveStatusProps) => {
  const { t } = useLanguage();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const statusLabel = state.saveStatus === "saving"
    ? t("workflowDesign.editor.saving")
    : state.saveStatus === "retrying"
      ? t("workflowDesign.editor.retrying")
      : state.saveStatus === "conflict"
        ? t("workflowDesign.editor.conflictTitle")
      : state.hasLocalChanges
        ? t("workflowDesign.editor.unsaved")
        : t("workflowDesign.editor.saveSuccess");
  const errorTargetLabel = (target: string) => target.startsWith("elements.")
    || target.startsWith("connections.")
    ? t("workflowDesign.editor.saveTargetCanvas")
    : target === "configuration.starter"
      ? t("workflowDesign.editor.saveTargetStarter")
      : target === "configuration.assignment"
        ? t("workflowDesign.editor.saveTargetAssignment")
        : target.startsWith("processFields.") || target.startsWith("formBindings.")
          ? t("workflowDesign.editor.saveTargetForm")
          : t("workflowDesign.editor.saveTargetDraft");
  const errorTargetId = (target: string) => target.startsWith("elements.")
    ? `workflow-element-${target.split(".")[1] ?? ""}`
    : target.startsWith("connections.")
      ? "workflow-canvas-title"
      : target === "configuration.starter"
        ? "workflow-starter-mode"
        : target === "configuration.assignment"
          ? "workflow-assignment-mode"
          : undefined;
  const saveErrors = state.invalidFieldNames.map((target, index) => ({
    id: `${target}:${index}`,
    fieldId: errorTargetId(target),
    fieldLabel: errorTargetLabel(target),
    message: state.errorMessages[index] ?? t("workflowDesign.editor.saveInvalidTarget")
  }));

  useEffect(() => {
    if (state.saveStatus !== "error") return;
    window.requestAnimationFrame(() => {
      errorSummaryRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
      errorSummaryRef.current?.focus();
    });
  }, [state.saveStatus]);

  return (
    <Card labelledBy="workflow-save-status-title">
      <div className="flex flex-wrap items-center justify-between gap-moviqo-3" aria-live="polite">
        <div className="grid gap-moviqo-1">
          <h2 className="m-0 text-base font-semibold" id="workflow-save-status-title">
            {t("workflowDesign.editor.saveStatusTitle")}
          </h2>
          <span className="text-sm text-moviqo-ink-secondary">{statusLabel}</span>
        </div>
        <Badge tone={state.hasLocalChanges ? "warning" : "success"}>
          {state.hasLocalChanges
            ? t("workflowDesign.editor.unsaved")
            : `${t("workflowDesign.draft.revision")} ${state.lastAcknowledgedRevision}`}
        </Badge>
      </div>
      {state.saveStatus === "error" ? (
        <ErrorSummary
          errors={saveErrors}
          formMessage={saveErrors.length === 0
            ? state.errorMessages.join(" ") || t("workflowDesign.editor.saveError")
            : t("workflowDesign.editor.saveError")}
          ref={errorSummaryRef}
          title={t("workflowDesign.editor.errorTitle")}
          onErrorActivate={(error) => onInvalidTarget(error.id.slice(0, error.id.lastIndexOf(":")))}
        />
      ) : null}
      {state.saveStatus === "conflict" ? (
        <Alert announcement="assertive" title={t("workflowDesign.editor.conflictTitle")} tone="warning">
          <p className="m-0">{t("workflowDesign.editor.conflictMessage")}</p>
          <ActionBar align="start">
            <Button variant="secondary" onClick={onReloadLatest}>
              {t("workflowDesign.editor.reloadLatest")}
            </Button>
            <Button
              disabled={!state.conflictLatestLoaded}
              variant="secondary"
              onClick={onReapplyChanges}
            >
              {t("workflowDesign.editor.reapplyChanges")}
            </Button>
          </ActionBar>
        </Alert>
      ) : null}
      {state.revisionRecoveryRequired && state.saveStatus !== "conflict" ? (
        <Alert announcement="assertive" title={t("workflowDesign.editor.conflictTitle")} tone="warning">
          <p className="m-0">{t("workflowDesign.editor.revisionRecoveryMessage")}</p>
          <ActionBar align="start">
            <Button variant="secondary" onClick={onReloadLatest}>
              {t("workflowDesign.editor.reloadLatest")}
            </Button>
          </ActionBar>
        </Alert>
      ) : null}
      {state.publishStatus === "error" ? (
        <Alert announcement="assertive" title={t("workflowDesign.editor.publishErrorTitle")} tone="error">
          {state.publishErrorMessage ?? t("workflowDesign.editor.publishError")}
        </Alert>
      ) : null}
      {state.publishStatus === "success" && state.publishedVersion ? (
        <Alert announcement="polite" tone="success">
          {t("workflowDesign.editor.publishSuccess")} {state.publishedVersion.versionNumber}
        </Alert>
      ) : null}
    </Card>
  );
};

type WorkflowEditorActionBarProps = {
  state: WorkflowDraftEditorState;
  onPublish: () => void;
  onRetrySave: () => void;
  onSave: () => void;
  onValidate: () => void;
};

export const WorkflowEditorActionBar = ({
  state,
  onPublish,
  onRetrySave,
  onSave,
  onValidate
}: WorkflowEditorActionBarProps) => {
  const { t } = useLanguage();
  const busy = state.saveStatus === "saving"
    || state.saveStatus === "retrying"
    || state.publicationStatus === "validating"
    || state.publishStatus === "publishing";
  const invalidTaskLabel = hasInvalidWorkflowTaskLabels(state.localDraft);

  return (
    <div className="sticky bottom-0 z-10 rounded-moviqo-guidance border border-moviqo-border bg-moviqo-surface-raised p-moviqo-4 shadow-lg">
      <ActionBar align="between">
        <span className="text-sm text-moviqo-ink-secondary">
          {t("workflowDesign.editor.keyboardSaveHint")}
        </span>
        <div className="flex flex-wrap gap-moviqo-2">
          {state.saveStatus === "error" && state.pendingSaveCommand ? (
            <Button disabled={busy || invalidTaskLabel} variant="secondary" onClick={onRetrySave}>
              {t("workflowDesign.editor.retrySave")}
            </Button>
          ) : null}
          <Button disabled={busy || invalidTaskLabel || !state.hasLocalChanges} onClick={onSave}>
            {state.saveStatus === "saving"
              ? t("workflowDesign.editor.saving")
              : t("workflowDesign.draft.save")}
          </Button>
          <Button
            disabled={busy || state.hasLocalChanges || state.revisionRecoveryRequired}
            variant="secondary"
            onClick={onValidate}
          >
            {state.publicationStatus === "validating"
              ? t("workflowDesign.editor.validatingPublication")
              : t("workflowDesign.editor.validatePublication")}
          </Button>
          <Button disabled={busy || !canPublishWorkflow(state)} onClick={onPublish}>
            {state.publishStatus === "publishing"
              ? t("workflowDesign.editor.publishingWorkflow")
              : t("workflowDesign.editor.publishWorkflow")}
          </Button>
        </div>
      </ActionBar>
    </div>
  );
};
