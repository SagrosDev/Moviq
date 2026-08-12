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
  ButtonLink,
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
  const [myTasksSearchDraft, setMyTasksSearchDraft] = useState(defaultMyProcessesQuery.taskSearch);
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
    state.status === "authenticated"
  );

  if (state.status !== "authenticated") {
    return <Alert announcement="polite">{t("app.loading")}</Alert>;
  }

  const selectedModule = module === "dashboard" ? "tasks" : module;
  const region = regionByModule[selectedModule];
  const isWorkModule = selectedModule !== "start-process";
  const canAuthor = canCreateWorkflow(state.context.membership.role);

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
        description={isWorkModule
          ? t("myWork.lede")
          : t("myWork.startWorkflows.pageLede")}
        title={isWorkModule ? t("myWork.title") : t(titleKeyByModule[selectedModule])}
      />
      {isWorkModule ? (
        <nav className="flex flex-wrap gap-moviqo-2" aria-label={t("myWork.tabs")}>
          <ButtonLink
            aria-current={selectedModule === "tasks" ? "page" : undefined}
            href="/my-work/tasks"
            variant={selectedModule === "tasks" ? "primary" : "secondary"}
            onClick={(event) => {
              if (!isUnmodifiedPrimaryClick(event)) return;
              event.preventDefault();
              navigate("/my-work/tasks");
            }}
          >
            {t("myWork.myTasks.title")}
          </ButtonLink>
          <ButtonLink
            aria-current={selectedModule === "processes" ? "page" : undefined}
            href="/my-work/processes"
            variant={selectedModule === "processes" ? "primary" : "secondary"}
            onClick={(event) => {
              if (!isUnmodifiedPrimaryClick(event)) return;
              event.preventDefault();
              navigate("/my-work/processes");
            }}
          >
            {t("myWork.myProcesses.title")}
          </ButtonLink>
        </nav>
      ) : null}
      <MyWorkShell
        myProcessesQuery={myProcessesQuery}
        myTasksSearchDraft={myTasksSearchDraft}
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
        onMyTasksSearchChange={setMyTasksSearchDraft}
        onMyTasksSearchSubmit={() => {
          setMyProcessesQuery((current) => ({
            ...current,
            myTasksPage: 1,
            taskSearch: myTasksSearchDraft.trim()
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
        showWorkflowCreation={selectedModule === "start-process" && canAuthor}
        snapshot={snapshot}
        startFeedbackByWorkflowId={startFeedbackByWorkflowId}
        startingWorkflowId={startingWorkflowId}
        workflowCreationHref={selectedModule === "start-process" && canAuthor ? "/workflows/new" : null}
      />
    </div>
  );
};
