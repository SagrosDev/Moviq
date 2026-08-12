import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate, useParams } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  WorkflowDraftEditor,
  createWorkflowDraftState,
  formDesignPath,
  useWorkflowDraftQuery,
  type WorkflowCreationAccepted,
  type WorkflowDraftDocument
} from "../../../features/workflow-design";
import { moviqoQueryKeys } from "../../../shared/api";
import type { DraftState } from "../../../shared/drafts";
import { useLanguage } from "../../../shared/localization";
import {
  Alert,
  Breadcrumbs,
  Button,
  isUnmodifiedPrimaryClick,
  PageHeader
} from "../../../shared/ui";

export const shouldAcceptWorkflowSnapshot = (
  currentWorkflowId: string | null,
  currentRevision: string | null,
  nextWorkflowId: string,
  nextRevision: string,
  isDirty: boolean
) => currentWorkflowId === null
  || currentWorkflowId !== nextWorkflowId
  || (!isDirty && currentRevision !== nextRevision);

export const WorkflowDesignPage = () => {
  const { t } = useLanguage();
  const { state } = useSession();
  const { workflowId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const query = useWorkflowDraftQuery(organizationId, workflowId);
  const [draftState, setDraftState] = useState<DraftState<WorkflowDraftDocument> | null>(null);
  const [acceptedSnapshot, setAcceptedSnapshot] = useState<WorkflowCreationAccepted | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveRequestToken, setSaveRequestToken] = useState(0);
  const [saveBeforeLeaving, setSaveBeforeLeaving] = useState(false);
  const [pendingFormTaskId, setPendingFormTaskId] = useState<string | null>(null);
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (!acceptedSnapshot || acceptedSnapshot.workflowId === workflowId) return;
    setDraftState(null);
    setAcceptedSnapshot(null);
    setIsDirty(false);
    setSaveBeforeLeaving(false);
    setPendingFormTaskId(null);
  }, [acceptedSnapshot?.workflowId, workflowId]);

  useEffect(() => {
    if (
      !query.data
      || !shouldAcceptWorkflowSnapshot(
        acceptedSnapshot?.workflowId ?? null,
        acceptedSnapshot?.revision ?? null,
        query.data.workflowId,
        query.data.revision,
        isDirty
      )
    ) {
      return;
    }
    setDraftState(createWorkflowDraftState(query.data));
    setAcceptedSnapshot(query.data);
  }, [acceptedSnapshot?.revision, acceptedSnapshot?.workflowId, isDirty, query.data]);

  useEffect(() => {
    if (saveBeforeLeaving && !isDirty && blocker.state === "blocked") {
      setSaveBeforeLeaving(false);
      setPendingFormTaskId(null);
      blocker.proceed();
    }
  }, [blocker, isDirty, saveBeforeLeaving]);

  const acceptSavedDraft = (
    nextDraftState: DraftState<WorkflowDraftDocument>,
    accepted: WorkflowCreationAccepted
  ) => {
    setDraftState(nextDraftState);
    setAcceptedSnapshot(accepted);
    queryClient.setQueryData(
      moviqoQueryKeys.workflowDraft(organizationId, workflowId),
      accepted
    );
    void queryClient.invalidateQueries({
      queryKey: moviqoQueryKeys.workflowCatalog(organizationId)
    });
  };

  const hasAcceptedWorkflow = Boolean(draftState && acceptedSnapshot);

  return (
    <div className="grid gap-moviqo-6">
      <Breadcrumbs
        items={[
          { href: "/workflows", label: t("workflowCatalog.title") },
          { current: true, label: acceptedSnapshot?.name ?? t("workflowDesign.editor.title") }
        ]}
        label={t("app.nav.primary")}
        onNavigate={(href, event) => {
          if (!isUnmodifiedPrimaryClick(event)) return;
          event.preventDefault();
          navigate(href);
        }}
      />
      <PageHeader
        actions={(
          <Button variant="secondary" onClick={() => navigate("/workflows")}>
            {t("workflowDesign.route.back")}
          </Button>
        )}
        description={acceptedSnapshot?.name}
        eyebrow={t("workflowDesign.editor.eyebrow")}
        title={t("workflowDesign.editor.title")}
      />
      {blocker.state === "blocked" ? (
        <Alert announcement="assertive" title={t("workflowDesign.leave.title")} tone="warning">
          <p>{t("workflowDesign.leave.body")}</p>
          <div className="flex flex-wrap gap-moviqo-2">
            <Button onClick={() => {
              setSaveBeforeLeaving(true);
              setSaveRequestToken((current) => current + 1);
            }}>
              {pendingFormTaskId
                ? t("workflowDesign.leave.saveAndDesignForm")
                : t("workflowDesign.leave.save")}
            </Button>
            <Button variant="destructive" onClick={() => {
              setSaveBeforeLeaving(false);
              setPendingFormTaskId(null);
              blocker.proceed();
            }}>
              {t("workflowDesign.leave.discard")}
            </Button>
            <Button variant="secondary" onClick={() => {
              setSaveBeforeLeaving(false);
              setPendingFormTaskId(null);
              blocker.reset();
            }}>
              {t("workflowDesign.leave.stay")}
            </Button>
          </div>
        </Alert>
      ) : null}
      {query.isError && hasAcceptedWorkflow ? (
        <Alert announcement="polite" tone="error">
          {t("workflowDesign.route.error")}
        </Alert>
      ) : null}
      {query.isError && !hasAcceptedWorkflow ? (
        <Alert announcement="assertive" tone="error">
          {t("workflowDesign.route.error")}
        </Alert>
      ) : !hasAcceptedWorkflow || !draftState || !acceptedSnapshot ? (
        <Alert announcement="polite">{t("workflowDesign.route.loading")}</Alert>
      ) : (
        <WorkflowDraftEditor
          configurationDirectory={acceptedSnapshot.configurationDirectory}
          draftState={draftState}
          onAccepted={acceptSavedDraft}
          onDirtyChange={setIsDirty}
          onDesignTaskForm={(taskElementId) => {
            setPendingFormTaskId(taskElementId);
            navigate(formDesignPath(workflowId, taskElementId));
          }}
          saveRequestToken={saveRequestToken}
        />
      )}
    </div>
  );
};
