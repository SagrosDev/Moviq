import { useReducer, type FormEvent } from "react";
import { useLanguage } from "../../../shared/localization";
import { ActionBar, Alert, Button, ButtonLink, Card, TextInput } from "../../../shared/ui";
import {
  createWorkflow,
  initialWorkflowCreationFormState,
  reduceWorkflowCreationForm
} from "../model/form";
import type { WorkflowCreationAccepted } from "../model/types";

type WorkflowCreateFormProps = {
  onBackHref: string;
  onBack?: () => void;
  onCreated: (accepted: WorkflowCreationAccepted) => void;
};

const buildIdempotencyKey = () =>
  `workflow-create-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const WorkflowCreateForm = ({
  onBackHref,
  onBack,
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

  return <Card labelledBy="workflow-create-title">
    <h2 id="workflow-create-title">{t("workflowDesign.create.title")}</h2>
    <p className="m-0 text-moviqo-ink-secondary">{t("workflowDesign.create.body")}</p>
    <form className="grid gap-moviqo-4" onSubmit={submit} noValidate>
      {errorMessage ? (
        <Alert announcement="assertive" tone="error">
          <span data-error-code={formState.errorCode}>{errorMessage}</span>
        </Alert>
      ) : null}
      <TextInput
        id="workflow-create-name"
        label={t("workflowDesign.create.name")}
        helpText={t("workflowDesign.create.help")}
        type="text"
        value={formState.name}
        onChange={(event) =>
          dispatch({ type: "name-changed", name: event.target.value })
        }
        maxLength={120}
        required
      />
      <ActionBar align="start">
        {onBack ? (
          <Button variant="secondary" onClick={onBack}>
            {t("workflowDesign.create.back")}
          </Button>
        ) : (
          <ButtonLink href={onBackHref} variant="secondary">
            {t("workflowDesign.create.back")}
          </ButtonLink>
        )}
        <Button type="submit" disabled={formState.status === "submitting"}>
          {formState.status === "submitting"
            ? t("workflowDesign.create.submitting")
            : t("workflowDesign.create.submit")}
        </Button>
      </ActionBar>
    </form>
  </Card>;
};
