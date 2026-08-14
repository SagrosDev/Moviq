import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useLanguage } from "../../../shared/localization";
import {
  ActionBar,
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  ErrorSummary,
  PageHeader
} from "../../../shared/ui";
import type { TaskFormEditorState } from "../model/taskForm";
import { taskFormErrorSummary, taskFormRetryTarget } from "../model/taskForm";
import { TaskFormRenderer } from "./TaskFormRenderer";

type TaskFormPanelProps = {
  state: TaskFormEditorState;
  onValueChange: (controlId: string, value: string) => void;
  onSave: () => void;
  onComplete: () => void;
  onRetrySave: () => void;
  onReloadLatest: () => void;
  breadcrumb?: ReactNode;
};

const toProcessReference = (processId: string) => processId.slice(0, 8);
const statusLabelFor = (status: string, t: ReturnType<typeof useLanguage>["t"]) => {
  if (status === "assigned") {
    return t("status.assigned");
  }
  if (status === "in_progress") {
    return t("status.inProgress");
  }
  if (status === "completed") {
    return t("status.completed");
  }
  return status;
};

export const TaskFormPanel = ({
  state,
  onValueChange,
  onSave,
  onComplete,
  onRetrySave,
  onReloadLatest,
  breadcrumb
}: TaskFormPanelProps) => {
  const { t } = useLanguage();
  const inputsDisabled = state.saveStatus === "saving" || state.completionStatus === "completing";
  const summaryRef = useRef<HTMLDivElement>(null);
  const summary = useMemo(() => taskFormErrorSummary(
    state.invalidFieldNames,
    state.errorMessages,
    state.controls
  ), [state.controls, state.errorMessages, state.invalidFieldNames]);
  const retryTarget = taskFormRetryTarget(state);

  useEffect(() => {
    if (state.errorMessages.length === 0) return;
    summaryRef.current?.focus();
    const firstFieldId = summary.errors[0]?.fieldId;
    if (!firstFieldId) return;
    window.requestAnimationFrame(() => {
      const field = document.getElementById(firstFieldId);
      if (!(field instanceof HTMLElement)) return;
      field.scrollIntoView({ block: "center", behavior: "auto" });
      field.focus();
    });
  }, [state.errorMessages, summary.errors]);

  const header = (
    <PageHeader
      breadcrumb={breadcrumb}
      description={state.workflowName}
      eyebrow={t("taskForm.eyebrow")}
      title={state.taskTitle}
      titleId="task-form-title"
    />
  );

  if (state.completionStatus === "success" && state.completionResult) {
    const processCompleted = state.completionResult.processStatus === "completed";
    return <section className="grid gap-moviqo-5" aria-labelledby="task-form-title">
      {header}
      <Card>
        <Alert announcement="polite" tone="success">
          {t(processCompleted ? "taskForm.completeSuccess" : "taskForm.taskCompleteSuccess")}
        </Alert>
        <p className="m-0 text-moviqo-ink-secondary">
          {t(processCompleted ? "taskForm.completeHandoff" : "taskForm.taskCompleteHandoff")}
        </p>
        <div className="flex flex-wrap gap-moviqo-2">
          <Badge tone="success">
            {t("taskForm.status")} {statusLabelFor(state.status, t)}
          </Badge>
          <Badge tone={processCompleted ? "success" : "info"}>
            {t(processCompleted ? "taskForm.processComplete" : "taskForm.processContinues")}
          </Badge>
        </div>
        <ActionBar align="start">
          <ButtonLink href={state.completionResult.destinationRoute}>
            {t(processCompleted ? "taskForm.viewProcess" : "taskForm.viewWork")}
          </ButtonLink>
        </ActionBar>
      </Card>
    </section>;
  }

  return <section className="grid gap-moviqo-5" aria-labelledby="task-form-title">
    {header}
    <Card>
      <div className="flex flex-wrap gap-moviqo-2">
        <Badge tone="info">
          {t("taskForm.process")} {toProcessReference(state.processId)}
        </Badge>
        <Badge tone="info">
          {t("taskForm.status")} {statusLabelFor(state.status, t)}
        </Badge>
        <Badge>{t("taskForm.revision")} {state.taskRevision}</Badge>
      </div>
      {state.errorMessages.length > 0 ? <div className="grid gap-moviqo-3">
        <ErrorSummary
          errors={summary.errors}
          formMessage={summary.formMessage}
          ref={summaryRef}
          title={t("taskForm.errorTitle")}
        />
        <ActionBar align="start">
          <Button
            variant="secondary"
            onClick={retryTarget === "complete" ? onComplete : onRetrySave}
          >
            {t("taskForm.retry")}
          </Button>
          <Button variant="secondary" onClick={onReloadLatest}>
            {t("taskForm.reloadLatest")}
          </Button>
        </ActionBar>
      </div> : null}
      <TaskFormRenderer
        disabled={inputsDisabled}
        errorMessages={state.errorMessages}
        invalidFieldNames={state.invalidFieldNames}
        items={state.items}
        onValueChange={onValueChange}
      />
      <ActionBar align="end">
        <Button
          variant="secondary"
          disabled={
            !state.actions.saveDraft
            || !state.hasLocalChanges
            || state.saveStatus === "saving"
            || state.completionStatus === "completing"
          }
          onClick={onSave}
        >
          {state.saveStatus === "saving" ? t("taskForm.saving") : t("taskForm.save")}
        </Button>
        <Button
          disabled={
            !state.actions.complete
            || state.saveStatus === "saving"
            || state.completionStatus === "completing"
          }
          onClick={onComplete}
        >
          {state.completionStatus === "completing" ? t("taskForm.completing") : t("taskForm.complete")}
        </Button>
      </ActionBar>
      {state.saveStatus === "success" ? (
        <Alert announcement="polite" tone="success">{t("taskForm.saveSuccess")}</Alert>
      ) : null}
    </Card>
  </section>;
};
