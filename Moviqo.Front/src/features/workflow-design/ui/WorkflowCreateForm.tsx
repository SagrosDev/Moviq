import { useReducer, type FormEvent } from "react";
import { useLanguage } from "../../../shared/localization";
import {
  createWorkflow,
  initialWorkflowCreationFormState,
  reduceWorkflowCreationForm
} from "../model/form";
import type { WorkflowCreationAccepted } from "../model/types";

type WorkflowCreateFormProps = {
  onBackHref: string;
  onCreated: (accepted: WorkflowCreationAccepted) => void;
};

const buildIdempotencyKey = () =>
  `workflow-create-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const WorkflowCreateForm = ({
  onBackHref,
  onCreated
}: WorkflowCreateFormProps) => {
  const { t } = useLanguage();
  const [formState, dispatch] = useReducer(
    reduceWorkflowCreationForm,
    initialWorkflowCreationFormState
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "submit-requested" });
    const result = await createWorkflow(formState.name, buildIdempotencyKey());

    if (!result.ok) {
      dispatch({
        type: "server-rejected",
        errorCode: result.error.code
      });
      return;
    }

    onCreated(result.data);
    dispatch({ type: "server-accepted" });
  };

  const errorMessage =
    formState.errorCode === "workflow_name_conflict"
      ? t("workflowDesign.create.conflict")
      : formState.errorCode
        ? t("workflowDesign.create.error")
        : null;

  return <section className="status-panel" aria-labelledby="workflow-create-title">
    <h2 id="workflow-create-title">{t("workflowDesign.create.title")}</h2>
    <p>{t("workflowDesign.create.body")}</p>
    <form className="form-card" onSubmit={submit} noValidate>
      {errorMessage ? <p role="alert" data-error-code={formState.errorCode}>{errorMessage}</p> : null}
      <label htmlFor="workflow-create-name">{t("workflowDesign.create.name")}</label>
      <input
        id="workflow-create-name"
        type="text"
        value={formState.name}
        onChange={(event) =>
          dispatch({ type: "name-changed", name: event.target.value })
        }
        maxLength={120}
        required
      />
      <p>{t("workflowDesign.create.help")}</p>
      <div className="button-row">
        <a className="button" data-variant="secondary" href={onBackHref}>
          {t("workflowDesign.create.back")}
        </a>
        <button className="button" type="submit" disabled={formState.status === "submitting"}>
          {formState.status === "submitting"
            ? t("workflowDesign.create.submitting")
            : t("workflowDesign.create.submit")}
        </button>
      </div>
    </form>
  </section>;
};
