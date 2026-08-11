import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  MyWorkShell,
  createWorkflowStartIdempotencyKey,
  defaultMyProcessesQuery,
  startWorkflow,
  type MyProcessesQuery,
  type MyWorkRegion,
  useMyWorkDashboard
} from "../../../features/my-work";
import { canCreateWorkflow } from "../../../features/workflow-design";
import { moviqoQueryKeys } from "../../../shared/api";
import { useLanguage, type MessageKey } from "../../../shared/localization";
import {
  Alert,
  Button,
  Card,
  isUnmodifiedPrimaryClick,
  PageHeader
} from "../../../shared/ui";

export type MyWorkModule = "dashboard" | "tasks" | "processes" | "start-process";

const regionByModule: Record<Exclude<MyWorkModule, "dashboard">, MyWorkRegion> = {
  tasks: "myTasks",
  processes: "myProcesses",
  "start-process": "startWorkflows"
};

const titleKeyByModule: Record<Exclude<MyWorkModule, "dashboard">, MessageKey> = {
  tasks: "myWork.myTasks.title",
  processes: "myWork.myProcesses.title",
  "start-process": "myWork.startWorkflows.title"
};

export const MyWorkPage = ({ module }: { module: MyWorkModule }) => {
  const { t } = useLanguage();
  const { state } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [myProcessesQuery, setMyProcessesQuery] = useState<MyProcessesQuery>(defaultMyProcessesQuery);
  const [myProcessesSearchDraft, setMyProcessesSearchDraft] = useState(defaultMyProcessesQuery.search);
  const [startingWorkflowId, setStartingWorkflowId] = useState<string | null>(null);
  const [startFeedbackByWorkflowId, setStartFeedbackByWorkflowId] = useState<Record<string, string | undefined>>({});
  const [startKeyByWorkflowId, setStartKeyByWorkflowId] = useState<Record<string, string | undefined>>({});
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const { retry, snapshot } = useMyWorkDashboard(
    myProcessesQuery,
    organizationId,
    module !== "dashboard" && state.status === "authenticated"
  );

  if (state.status !== "authenticated") {
    return <Alert announcement="polite">{t("app.loading")}</Alert>;
  }

  if (module === "dashboard") {
    const canAuthor = canCreateWorkflow(state.context.membership.role);
    return (
      <div className="grid gap-moviqo-6">
        <PageHeader description={t("dashboard.lede")} title={t("dashboard.title")} />
        <div className="grid gap-moviqo-4 tablet:grid-cols-2">
          <Card><Button onClick={() => navigate("/my-work/tasks")}>{t("dashboard.tasks")}</Button></Card>
          <Card><Button onClick={() => navigate("/my-work/processes")}>{t("dashboard.processes")}</Button></Card>
          <Card><Button onClick={() => navigate("/processes/start")}>{t("dashboard.startProcess")}</Button></Card>
          {canAuthor ? (
            <Card><Button onClick={() => navigate("/workflows")}>{t("dashboard.authoring")}</Button></Card>
          ) : null}
        </div>
      </div>
    );
  }

  const region = regionByModule[module];

  const handleStartWorkflow = async (workflowId: string) => {
    const idempotencyKey = startKeyByWorkflowId[workflowId]
      ?? createWorkflowStartIdempotencyKey(workflowId);
    setStartKeyByWorkflowId((current) => ({ ...current, [workflowId]: idempotencyKey }));
    setStartingWorkflowId(workflowId);
    setStartFeedbackByWorkflowId((current) => ({ ...current, [workflowId]: undefined }));
    const result = await startWorkflow(workflowId, idempotencyKey);
    if (!result.ok) {
      setStartingWorkflowId(null);
      setStartFeedbackByWorkflowId((current) => ({
        ...current,
        [workflowId]: t("myWork.startWorkflows.startError")
      }));
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: moviqoQueryKeys.organization(organizationId)
    });
    navigate(result.data.destinationRoute);
  };

  return (
    <div className="grid gap-moviqo-6">
      <PageHeader
        description={t("myWork.lede")}
        eyebrow={t("myWork.eyebrow")}
        title={t(titleKeyByModule[module])}
      />
      <MyWorkShell
        myProcessesQuery={myProcessesQuery}
        myProcessesSearchDraft={myProcessesSearchDraft}
        myProcessesTimeZone={state.context.membership.organizationTimezone}
        onMyProcessesPageChange={(page) => {
          setMyProcessesQuery((current) => ({ ...current, page: Math.max(1, page) }));
        }}
        onMyTasksPageChange={(page) => {
          setMyProcessesQuery((current) => ({
            ...current,
            myTasksPage: Math.max(1, page)
          }));
        }}
        onMyProcessesSearchChange={setMyProcessesSearchDraft}
        onMyProcessesSearchSubmit={() => {
          setMyProcessesQuery((current) => ({
            ...current,
            page: 1,
            search: myProcessesSearchDraft.trim()
          }));
        }}
        onNavigate={(href, event) => {
          if (!isUnmodifiedPrimaryClick(event)) return;
          event.preventDefault();
          navigate(href);
        }}
        onRetry={() => void retry()}
        onStartWorkflow={(workflowId) => void handleStartWorkflow(workflowId)}
        onStartWorkflowsPageChange={(page) => {
          setMyProcessesQuery((current) => ({
            ...current,
            startWorkflowsPage: Math.max(1, page)
          }));
        }}
        regions={[region]}
        showHeading={false}
        showRegionNavigation={false}
        showWorkflowCreation={false}
        snapshot={snapshot}
        startFeedbackByWorkflowId={startFeedbackByWorkflowId}
        startingWorkflowId={startingWorkflowId}
        workflowCreationHref={null}
      />
    </div>
  );
};
