import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate, useParams } from "react-router";
import { useSession } from "../../../features/authentication";
import { FormDesignerWorkspace } from "../../../features/form-design";
import {
  canCreateWorkflow,
  formDesignPath,
  resolveTaskElement,
  useWorkflowCatalogQuery,
  useWorkflowDraftQuery,
  workflowDesignPath,
  workflowTaskDesignPath,
  workflowTaskElements
} from "../../../features/workflow-design";
import { moviqoQueryKeys } from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import {
  Alert,
  Breadcrumbs,
  Button,
  Card,
  isUnmodifiedPrimaryClick,
  LoadingState,
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
  const canAuthor = state.status === "authenticated"
    && canCreateWorkflow(state.context.membership.role);
  const catalogQuery = useWorkflowCatalogQuery(organizationId);
  const showEmptyCatalog = catalogQuery.isSuccess && catalogQuery.data.items.length === 0;
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
        title={t("formLauncher.title")}
      />
      {catalogQuery.isPending ? (
        <LoadingState>{t("workflowCatalog.loading")}</LoadingState>
      ) : catalogQuery.isError ? (
        <Alert announcement="assertive" title={t("formLauncher.catalogError")} tone="error">
          <Button variant="secondary" onClick={() => void catalogQuery.refetch()}>
            {t("workflowCatalog.retry")}
          </Button>
        </Alert>
      ) : showEmptyCatalog ? (
        <Card labelledBy="forms-empty-title">
          <div className="grid gap-moviqo-4" role="status">
            <h2 className="m-0 text-moviqo-heading" id="forms-empty-title">
              {t("formLauncher.noWorkflows")}
            </h2>
            <ol className="m-0 grid gap-moviqo-2 pl-moviqo-6 text-moviqo-ink-secondary">
              <li>{t("formLauncher.emptyStepWorkflow")}</li>
              <li>{t("formLauncher.emptyStepForm")}</li>
            </ol>
            {canAuthor ? (
              <div>
                <Button onClick={() => navigate("/workflows/new")}>
                  {t("workflowCatalog.create")}
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="grid gap-moviqo-4 tablet:grid-cols-2">
            <SelectField
              id="form-launcher-workflow"
              label={t("formLauncher.workflow")}
              options={[
                { value: "", label: t("formLauncher.selectWorkflow") },
                ...(catalogQuery.data?.items ?? []).map((workflow) => ({
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
            <Alert announcement="assertive" title={t("formLauncher.unavailable")} tone="error">
              <Button variant="secondary" onClick={() => void draftQuery.refetch()}>
                {t("workflowCatalog.retry")}
              </Button>
            </Alert>
          ) : workflowId && draftQuery.isPending ? (
            <LoadingState>{t("workflowDesign.route.loading")}</LoadingState>
          ) : workflowId && tasks.length === 0 ? (
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
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [saveRequestToken, setSaveRequestToken] = useState(0);
  const [canSave, setCanSave] = useState(false);
  const allowNavigation = useRef(false);
  const navigationSaveIntent = useRef(false);
  const blocker = useBlocker(() => isDirty && !allowNavigation.current);
  const { workflowId = "", taskElementId = "" } = useParams();
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const draftQuery = useWorkflowDraftQuery(organizationId, workflowId);
  const task = draftQuery.data
    ? resolveTaskElement(draftQuery.data.draft, taskElementId)
    : null;

  useEffect(() => {
    setCanSave(false);
  }, [taskElementId, workflowId]);

  if (draftQuery.isPending) {
    return <LoadingState>{t("workflowDesign.route.loading")}</LoadingState>;
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
      {blocker.state === "blocked" ? (
        <Alert announcement="assertive" title={t("formDesign.leave.title")} tone="warning">
          <p className="m-0">{t("formDesign.leave.body")}</p>
          <div className="flex flex-wrap gap-moviqo-2">
            <Button disabled={!canSave} onClick={() => {
              navigationSaveIntent.current = true;
              setSaveRequestToken((token) => token + 1);
            }}>
              {t("formDesign.leave.save")}
            </Button>
            <Button variant="destructive" onClick={() => {
              navigationSaveIntent.current = false;
              blocker.proceed();
            }}>
              {t("formDesign.leave.discard")}
            </Button>
            <Button variant="secondary" onClick={() => {
              navigationSaveIntent.current = false;
              blocker.reset();
            }}>
              {t("formDesign.leave.stay")}
            </Button>
          </div>
        </Alert>
      ) : null}
      <FormDesignerWorkspace
        accepted={draftQuery.data}
        key={`${workflowId}:${taskElementId}`}
        onDirtyChange={setIsDirty}
        onSaveAvailabilityChange={setCanSave}
        taskElementId={taskElementId}
        onAccepted={(accepted) => {
          queryClient.setQueryData(
            moviqoQueryKeys.workflowDraft(organizationId, workflowId),
            accepted
          );
          void queryClient.invalidateQueries({
            queryKey: moviqoQueryKeys.workflowCatalog(organizationId)
          });
        }}
        onReturn={() => {
          allowNavigation.current = true;
          navigate(workflowTaskDesignPath(workflowId, taskElementId));
        }}
        onSaveResult={(saved) => {
          if (saved && navigationSaveIntent.current && blocker.state === "blocked") {
            navigationSaveIntent.current = false;
            blocker.proceed();
          }
        }}
        saveRequestToken={saveRequestToken}
      />
    </div>
  );
};
