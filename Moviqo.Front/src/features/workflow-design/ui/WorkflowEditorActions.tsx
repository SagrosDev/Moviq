import { useEffect, useRef } from "react";
import { useLanguage } from "../../../shared/localization";
import { ActionBar, Alert, Badge, Button, Card, ErrorSummary } from "../../../shared/ui";
import {
  canPublishWorkflow,
  canSaveWorkflow,
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
  const conflictSummaryRef = useRef<HTMLDivElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (state.saveStatus !== "conflict" && !state.revisionRecoveryRequired) return;
    window.requestAnimationFrame(() => {
      conflictSummaryRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
      conflictSummaryRef.current?.focus();
    });
  }, [state.revisionRecoveryRequired, state.saveStatus]);

  const hasRecoveryFeedback = state.saveStatus === "error"
    || state.saveStatus === "conflict"
    || state.revisionRecoveryRequired
    || state.publishStatus === "error"
    || state.publishStatus === "success";

  if (!hasRecoveryFeedback) return null;

  return (
    <Card labelledBy="workflow-save-status-title">
      <h2 className="sr-only" id="workflow-save-status-title">
        {t("workflowDesign.editor.saveStatusTitle")}
      </h2>
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
        <div id="workflow-conflict-summary" ref={conflictSummaryRef} tabIndex={-1}>
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
        </div>
      ) : null}
      {state.revisionRecoveryRequired && state.saveStatus !== "conflict" ? (
        <div ref={conflictSummaryRef} tabIndex={-1}>
          <Alert announcement="assertive" title={t("workflowDesign.editor.conflictTitle")} tone="warning">
            <p className="m-0">{t("workflowDesign.editor.revisionRecoveryMessage")}</p>
            <ActionBar align="start">
              <Button variant="secondary" onClick={onReloadLatest}>
                {t("workflowDesign.editor.reloadLatest")}
              </Button>
            </ActionBar>
          </Alert>
        </div>
      ) : null}
      {state.publishStatus === "error" ? (
        <div id="workflow-publish-error-summary" tabIndex={-1}>
          <Alert announcement="assertive" title={t("workflowDesign.editor.publishErrorTitle")} tone="error">
            {state.publishErrorMessage ?? t("workflowDesign.editor.publishError")}
          </Alert>
        </div>
      ) : null}
      {state.publishStatus === "success" && state.publishedVersion ? (
        <Alert announcement="polite" tone="success">
          {t("workflowDesign.editor.publishSuccess")} {state.publishedVersion.versionNumber}
        </Alert>
      ) : null}
    </Card>
  );
};

type WorkflowCompactSaveStatusProps = {
  state: WorkflowDraftEditorState;
};

export const WorkflowCompactSaveStatus = ({ state }: WorkflowCompactSaveStatusProps) => {
  const { t } = useLanguage();
  const statusLabel = state.saveStatus === "saving"
    ? t("workflowDesign.editor.saving")
    : state.saveStatus === "retrying"
      ? t("workflowDesign.editor.retrying")
      : state.saveStatus === "conflict" || state.revisionRecoveryRequired
        ? t("workflowDesign.editor.conflictTitle")
        : state.saveStatus === "error"
          ? t("workflowDesign.editor.errorTitle")
          : state.hasLocalChanges
            ? t("workflowDesign.editor.unsaved")
            : `${t("workflowDesign.editor.saveSuccess")} · ${t("workflowDesign.draft.revision")} ${state.lastAcknowledgedRevision}`;
  const tone = state.saveStatus === "error"
    ? "error" as const
    : state.saveStatus === "conflict" || state.revisionRecoveryRequired || state.hasLocalChanges
      ? "warning" as const
      : state.saveStatus === "saving" || state.saveStatus === "retrying"
        ? "info" as const
        : "success" as const;

  return (
    <span aria-atomic="true" aria-live="polite" data-workflow-save-status="compact">
      <Badge tone={tone}>{statusLabel}</Badge>
    </span>
  );
};

type WorkflowEditorActionBarProps = {
  state: WorkflowDraftEditorState;
  onPublish: () => void;
  onRetrySave: () => void;
  onSave: () => void;
};

export const WorkflowEditorActionBar = ({
  state,
  onPublish,
  onRetrySave,
  onSave
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
          <Button
            disabled={!canSaveWorkflow(state)}
            variant="secondary"
            onClick={onSave}
          >
            {state.saveStatus === "saving"
              ? t("workflowDesign.editor.saving")
              : t("workflowDesign.draft.save")}
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
