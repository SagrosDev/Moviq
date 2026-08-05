import { useLanguage } from "../../../shared/localization";
import type { TaskFormEditorState } from "../model/taskForm";

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
      {state.errorMessages.length > 0 ? <div className="workflow-editor__errors" role="alert">
        <strong>{t("taskForm.errorTitle")}</strong>
        <ul>
          {state.errorMessages.map((message) => <li key={message}>{message}</li>)}
        </ul>
        <div className="button-row">
          <button className="button" data-variant="secondary" type="button" onClick={onRetrySave}>
            {t("taskForm.retry")}
          </button>
          <button className="button" data-variant="secondary" type="button" onClick={onReloadLatest}>
            {t("taskForm.reloadLatest")}
          </button>
        </div>
      </div> : null}
      <div className="task-form-grid">
        {state.controls.map((control) => {
          const invalidMessage = fieldMessageFor(
            state.invalidFieldNames,
            state.errorMessages,
            control.controlId
          );
          return <label key={control.controlId} className="task-form-field">
            <span>{control.label}</span>
            {control.helpText ? <small>{control.helpText}</small> : null}
            <input
              type="text"
              value={control.value}
              placeholder={control.placeholder}
              disabled={inputsDisabled}
              aria-invalid={Boolean(invalidMessage)}
              onChange={(event) => onValueChange(control.controlId, event.target.value)}
            />
            {invalidMessage ? <p className="validation-message">{invalidMessage}</p> : null}
          </label>;
        })}
      </div>
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

const fieldMessageFor = (
  invalidFieldNames: string[],
  errorMessages: string[],
  controlId: string
) => {
  const index = invalidFieldNames.findIndex(
    (name) => name === `controls.${controlId}.value`
  );
  return index >= 0 ? errorMessages[index] : null;
};
