import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../../../shared/localization";
import { Button, ErrorSummary } from "../../../shared/ui";
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
  onReloadLatest
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

  if (state.completionStatus === "success" && state.completionResult) {
    return <section className="task-form-shell" aria-labelledby="task-form-title">
      <header className="page-heading">
        <p className="eyebrow">{t("taskForm.eyebrow")}</p>
        <h1 id="task-form-title">{state.taskTitle}</h1>
        <p className="lede">{state.workflowName}</p>
      </header>
      <article className="task-form-panel">
        <p className="success-message">{t("taskForm.completeSuccess")}</p>
        <p>{state.completionResult.handoffMessage}</p>
        <div className="task-form-panel__meta">
          <span>{t("taskForm.status")} {statusLabelFor(state.status, t)}</span>
          <span>{t("taskForm.processComplete")}</span>
        </div>
        <div className="task-form-actions">
          <a className="button" href={state.completionResult.destinationRoute}>
            {t("taskForm.back")}
          </a>
        </div>
      </article>
    </section>;
  }

  return <section className="task-form-shell" aria-labelledby="task-form-title">
    <header className="page-heading">
      <p className="eyebrow">{t("taskForm.eyebrow")}</p>
      <h1 id="task-form-title">{state.taskTitle}</h1>
      <p className="lede">{state.workflowName}</p>
      <p>{`${t("taskForm.process")} ${toProcessReference(state.processId)}`}</p>
    </header>
    <article className="task-form-panel">
      <div className="task-form-panel__meta">
        <span>{t("taskForm.status")} {statusLabelFor(state.status, t)}</span>
        <span>{t("taskForm.revision")} {state.taskRevision}</span>
      </div>
      {state.errorMessages.length > 0 ? <div className="grid gap-moviqo-3">
        <ErrorSummary
          errors={summary.errors}
          formMessage={summary.formMessage}
          ref={summaryRef}
          title={t("taskForm.errorTitle")}
        />
        <div className="button-row">
          <Button
            variant="secondary"
            onClick={retryTarget === "complete" ? onComplete : onRetrySave}
          >
            {t("taskForm.retry")}
          </Button>
          <Button variant="secondary" onClick={onReloadLatest}>
            {t("taskForm.reloadLatest")}
          </Button>
        </div>
      </div> : null}
      <TaskFormRenderer
        disabled={inputsDisabled}
        errorMessages={state.errorMessages}
        invalidFieldNames={state.invalidFieldNames}
        items={state.items}
        onValueChange={onValueChange}
      />
      <div className="task-form-actions">
        <button
          className="button"
          type="button"
          disabled={
            !state.actions.saveDraft
            || !state.hasLocalChanges
            || state.saveStatus === "saving"
            || state.completionStatus === "completing"
          }
          onClick={onSave}
        >
          {state.saveStatus === "saving" ? t("taskForm.saving") : t("taskForm.save")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={
            !state.actions.complete
            || state.saveStatus === "saving"
            || state.completionStatus === "completing"
          }
          onClick={onComplete}
        >
          {state.completionStatus === "completing" ? t("taskForm.completing") : t("taskForm.complete")}
        </button>
      </div>
      {state.saveStatus === "success" ? (
        <p className="success-message">{t("taskForm.saveSuccess")}</p>
      ) : null}
    </article>
  </section>;
};
