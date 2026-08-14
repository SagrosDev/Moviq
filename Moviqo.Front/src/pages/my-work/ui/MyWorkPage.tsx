import { useRef, useState } from "react";
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
  ButtonLink,
  isUnmodifiedPrimaryClick,
  LoadingState,
  PageHeader
} from "../../../shared/ui";

export type MyWorkModule = "tasks" | "processes" | "start-process";

const regionByModule: Record<MyWorkModule, MyWorkRegion> = {
  tasks: "myTasks",
  processes: "myProcesses",
  "start-process": "startWorkflows"
};

const summaryKeyByModule: Record<"tasks" | "processes", MessageKey> = {
  tasks: "myWork.myTasks.summary",
  processes: "myWork.myProcesses.summary"
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
  const startingWorkflowIdRef = useRef<string | null>(null);
  const [startFeedbackByWorkflowId, setStartFeedbackByWorkflowId] = useState<Record<string, string | undefined>>({});
  const [startKeyByWorkflowId, setStartKeyByWorkflowId] = useState<Record<string, string | undefined>>({});
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const { isRefreshing, retry, snapshot } = useMyWorkDashboard(
    myProcessesQuery,
    organizationId,
    state.status === "authenticated"
  );

  if (state.status !== "authenticated") {
    return <LoadingState>{t("app.loading")}</LoadingState>;
  }

  const region = regionByModule[module];
  const isWorkModule = module !== "start-process";
  const canAuthor = canCreateWorkflow(state.context.membership.role);

  const handleStartWorkflow = async (workflowId: string) => {
    if (startingWorkflowIdRef.current !== null) {
      return;
    }

    startingWorkflowIdRef.current = workflowId;
    const idempotencyKey = startKeyByWorkflowId[workflowId]
      ?? createWorkflowStartIdempotencyKey(workflowId);
    setStartKeyByWorkflowId((current) => ({ ...current, [workflowId]: idempotencyKey }));
    setStartingWorkflowId(workflowId);
    setStartFeedbackByWorkflowId((current) => ({ ...current, [workflowId]: undefined }));
    const result = await startWorkflow(workflowId, idempotencyKey);
    if (!result.ok) {
      startingWorkflowIdRef.current = null;
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
        description={module === "start-process"
          ? t("myWork.startWorkflows.pageLede")
          : t(summaryKeyByModule[module])}
        title={module === "start-process"
          ? t("myWork.startWorkflows.title")
          : t("app.nav.dashboard")}
      />
      {isWorkModule ? (
        <nav className="flex flex-wrap gap-moviqo-2" aria-label={t("myWork.tabs")}>
          <ButtonLink
            aria-current={module === "tasks" ? "page" : undefined}
            href="/my-work/tasks"
            variant={module === "tasks" ? "primary" : "secondary"}
            onClick={(event) => {
              if (!isUnmodifiedPrimaryClick(event)) return;
              event.preventDefault();
              navigate("/my-work/tasks");
            }}
          >
            {t("myWork.myTasks.title")}
          </ButtonLink>
          <ButtonLink
            aria-current={module === "processes" ? "page" : undefined}
            href="/my-work/processes"
            variant={module === "processes" ? "primary" : "secondary"}
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
        isRefreshing={isRefreshing}
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
        showWorkflowCreation={module === "start-process" && canAuthor}
        snapshot={snapshot}
        startFeedbackByWorkflowId={startFeedbackByWorkflowId}
        startingWorkflowId={startingWorkflowId}
        workflowCreationHref={module === "start-process" && canAuthor ? "/workflows/new" : null}
      />
    </div>
  );
};
