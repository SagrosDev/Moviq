import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  formDesignPath,
  resolveTaskElement,
  useWorkflowCatalogQuery,
  useWorkflowDraftQuery,
  workflowDesignPath,
  workflowTaskElements
} from "../../../features/workflow-design";
import { useLanguage } from "../../../shared/localization";
import {
  Alert,
  Breadcrumbs,
  Button,
  Card,
  isUnmodifiedPrimaryClick,
  PageHeader,
  SelectField
} from "../../../shared/ui";

export const FormLauncherPage = () => {
  const { t } = useLanguage();
  const { state } = useSession();
  const navigate = useNavigate();
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const catalogQuery = useWorkflowCatalogQuery(organizationId);
  const [workflowId, setWorkflowId] = useState("");
  const [taskElementId, setTaskElementId] = useState("");
  const draftQuery = useWorkflowDraftQuery(organizationId, workflowId, Boolean(workflowId));
  const tasks = useMemo(
    () => draftQuery.data ? workflowTaskElements(draftQuery.data.draft) : [],
    [draftQuery.data]
  );
  const selectedTaskIsCurrent = tasks.some((task) => task.id === taskElementId);

  useEffect(() => {
    setTaskElementId("");
  }, [workflowId]);

  useEffect(() => {
    if (draftQuery.isSuccess && taskElementId && !selectedTaskIsCurrent) {
      setTaskElementId("");
    }
  }, [draftQuery.isSuccess, selectedTaskIsCurrent, taskElementId]);

  return (
    <div className="grid gap-moviqo-6">
      <PageHeader
        description={t("formLauncher.lede")}
        eyebrow={t("formLauncher.eyebrow")}
        title={t("formLauncher.title")}
      />
      {catalogQuery.isError ? (
        <Alert announcement="assertive" tone="error">{t("formLauncher.unavailable")}</Alert>
      ) : catalogQuery.isPending ? (
        <Alert announcement="polite">{t("workflowCatalog.loading")}</Alert>
      ) : catalogQuery.data.items.length === 0 ? (
        <Alert announcement="polite">{t("formLauncher.noWorkflows")}</Alert>
      ) : (
        <Card>
          <div className="grid gap-moviqo-4 tablet:grid-cols-2">
            <SelectField
              id="form-launcher-workflow"
              label={t("formLauncher.workflow")}
              options={[
                { value: "", label: t("formLauncher.selectWorkflow") },
                ...catalogQuery.data.items.map((workflow) => ({
                  value: workflow.workflowId,
                  label: workflow.name
                }))
              ]}
              value={workflowId}
              onChange={(event) => setWorkflowId(event.target.value)}
            />
            <SelectField
              disabled={!workflowId || draftQuery.isPending || tasks.length === 0}
              id="form-launcher-task"
              label={t("formLauncher.task")}
              options={[
                { value: "", label: t("formLauncher.selectTask") },
                ...tasks.map((task) => ({ value: task.id, label: task.label }))
              ]}
              value={taskElementId}
              onChange={(event) => setTaskElementId(event.target.value)}
            />
          </div>
          {draftQuery.isError ? (
            <Alert announcement="assertive" tone="error">{t("formLauncher.unavailable")}</Alert>
          ) : workflowId && !draftQuery.isPending && tasks.length === 0 ? (
            <Alert announcement="polite">{t("formLauncher.noTasks")}</Alert>
          ) : null}
          <Button
            disabled={!workflowId || !taskElementId || !selectedTaskIsCurrent}
            onClick={() => {
              if (selectedTaskIsCurrent) {
                navigate(formDesignPath(workflowId, taskElementId));
              }
            }}
          >
            {t("formLauncher.open")}
          </Button>
        </Card>
      )}
    </div>
  );
};

export const FormDesignRoutePage = () => {
  const { t } = useLanguage();
  const { state } = useSession();
  const navigate = useNavigate();
  const { workflowId = "", taskElementId = "" } = useParams();
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const draftQuery = useWorkflowDraftQuery(organizationId, workflowId);
  const task = draftQuery.data
    ? resolveTaskElement(draftQuery.data.draft, taskElementId)
    : null;

  if (draftQuery.isPending) {
    return <Alert announcement="polite">{t("workflowDesign.route.loading")}</Alert>;
  }

  if (draftQuery.isError || !task) {
    return (
      <div className="grid gap-moviqo-4">
        <Alert announcement="assertive" tone="error">{t("formLauncher.unavailable")}</Alert>
        <Button variant="secondary" onClick={() => navigate("/forms")}>
          {t("formDesign.backToForms")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-moviqo-6">
      <Breadcrumbs
        items={[
          { href: "/forms", label: t("formLauncher.title") },
          { href: workflowDesignPath(workflowId), label: draftQuery.data.name },
          { current: true, label: task.label }
        ]}
        label={t("app.nav.primary")}
        onNavigate={(href, event) => {
          if (!isUnmodifiedPrimaryClick(event)) return;
          event.preventDefault();
          navigate(href);
        }}
      />
      <PageHeader
        description={`${draftQuery.data.name} · ${task.label}`}
        eyebrow={t("formDesign.eyebrow")}
        title={t("formDesign.title")}
      />
      <Alert announcement="polite">{t("formDesign.reserved")}</Alert>
    </div>
  );
};
