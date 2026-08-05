import { useEffect, useState } from "react";
import { protectedEntryPath, useSession } from "../../../features/authentication";
import {
  MyWorkShell,
  createWorkflowStartIdempotencyKey,
  startWorkflow,
  useMyWorkDashboard
} from "../../../features/my-work";
import { canCreateWorkflow } from "../../../features/workflow-design";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const MyWorkPage = () => {
  const { t } = useLanguage();
  const { signOutCurrentSession, state } = useSession();
  const { retry, snapshot } = useMyWorkDashboard(state.status === "authenticated");
  const [startingWorkflowId, setStartingWorkflowId] = useState<string | null>(null);
  const [startFeedbackByWorkflowId, setStartFeedbackByWorkflowId] = useState<Record<string, string | undefined>>({});
  const [startKeyByWorkflowId, setStartKeyByWorkflowId] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (state.status === "anonymous") {
      window.location.assign("/sign-in");
    }
  }, [state.status]);

  if (state.status !== "authenticated") {
    return <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/">Moviqo</a>
        <LanguageSelector />
      </header>
      <main className="app-main">
        <p className="status-panel" role="status">{t("myWork.sessionLoading")}</p>
      </main>
    </div>;
  }

  const handleStartWorkflow = async (workflowId: string) => {
    const idempotencyKey = startKeyByWorkflowId[workflowId] ?? createWorkflowStartIdempotencyKey(workflowId);
    if (!startKeyByWorkflowId[workflowId]) {
      setStartKeyByWorkflowId((current) => ({
        ...current,
        [workflowId]: idempotencyKey
      }));
    }
    setStartingWorkflowId(workflowId);
    setStartFeedbackByWorkflowId((current) => ({
      ...current,
      [workflowId]: undefined
    }));
    const result = await startWorkflow(workflowId, idempotencyKey);
    if (!result.ok) {
      setStartingWorkflowId(null);
      setStartFeedbackByWorkflowId((current) => ({
        ...current,
        [workflowId]: t("myWork.startWorkflows.startError")
      }));
      return;
    }

    setStartFeedbackByWorkflowId((current) => ({
      ...current,
      [workflowId]: t("myWork.startWorkflows.openingTask")
    }));
    setStartingWorkflowId(null);
    window.setTimeout(() => {
      window.location.assign(result.data.destinationRoute);
    }, 0);
  };

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href={protectedEntryPath}>{t("app.nav.work")}</a>
      <nav className="app-nav" aria-label={t("myWork.primaryNav")}>
        <a href="#my-work-myTasks">{t("myWork.myTasks.title")}</a>
        <a href="#my-work-startWorkflows">{t("myWork.startWorkflows.title")}</a>
        <a href="#my-work-myProcesses">{t("myWork.myProcesses.title")}</a>
      </nav>
      <div className="language-selector">
        <LanguageSelector />
        <button className="button" data-variant="secondary" type="button" onClick={() => void signOutCurrentSession()}>
          {t("auth.signOut")}
        </button>
      </div>
    </header>
    <main className="app-main">
      <MyWorkShell
        onStartWorkflow={(workflowId) => void handleStartWorkflow(workflowId)}
        snapshot={snapshot}
        onRetry={retry}
        startFeedbackByWorkflowId={startFeedbackByWorkflowId}
        startingWorkflowId={startingWorkflowId}
        showWorkflowCreation={canCreateWorkflow(state.context.membership.role)}
        workflowCreationHref="/my-work/workflows/new"
      />
    </main>
  </div>;
};
