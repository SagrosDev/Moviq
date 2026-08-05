import { useLanguage } from "../../../shared/localization";
import type { TaskFormEditorState } from "../model/taskForm";

type TaskFormPanelProps = {
  state: TaskFormEditorState;
  onValueChange: (controlId: string, value: string) => void;
  onSave: () => void;
  onRetry: () => void;
};

export const TaskFormPanel = ({
  state,
  onValueChange,
  onSave,
  onRetry
}: TaskFormPanelProps) => {
  const { t } = useLanguage();

  return <section className="task-form-shell" aria-labelledby="task-form-title">
    <header className="page-heading">
      <p className="eyebrow">{t("taskForm.eyebrow")}</p>
      <h1 id="task-form-title">{state.taskTitle}</h1>
      <p className="lede">{state.workflowName}</p>
    </header>
    <article className="task-form-panel">
      <div className="task-form-panel__meta">
        <span>{t("taskForm.status")} {state.status}</span>
        <span>{t("taskForm.revision")} {state.taskRevision}</span>
      </div>
      {state.errorMessages.length > 0 ? <div className="workflow-editor__errors" role="alert">
        <strong>{t("taskForm.errorTitle")}</strong>
        <ul>
          {state.errorMessages.map((message) => <li key={message}>{message}</li>)}
        </ul>
        <button className="button" data-variant="secondary" type="button" onClick={onRetry}>
          {t("taskForm.retry")}
        </button>
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
          }
          onClick={onSave}
        >
          {state.saveStatus === "saving" ? t("taskForm.saving") : t("taskForm.save")}
        </button>
        <button className="button" data-variant="secondary" type="button" disabled>
          {t("taskForm.complete")}
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
