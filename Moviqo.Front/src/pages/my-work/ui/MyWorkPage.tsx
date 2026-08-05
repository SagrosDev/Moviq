import { useEffect } from "react";
import { protectedEntryPath, useSession } from "../../../features/authentication";
import { MyWorkShell, useMyWorkDashboard } from "../../../features/my-work";
import { canCreateWorkflow } from "../../../features/workflow-design";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const MyWorkPage = () => {
  const { t } = useLanguage();
  const { signOutCurrentSession, state } = useSession();
  const { retry, snapshot } = useMyWorkDashboard(state.status === "authenticated");

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
        snapshot={snapshot}
        onRetry={retry}
        showWorkflowCreation={canCreateWorkflow(state.context.membership.role)}
        workflowCreationHref="/my-work/workflows/new"
      />
    </main>
  </div>;
};
