import { useEffect, useState } from "react";
import {
  protectedEntryPath,
  useSession
} from "../../../features/authentication";
import {
  WorkflowCreateForm,
  type WorkflowConfigurationDirectory,
  WorkflowDraftEditor,
  canCreateWorkflow,
  createWorkflowDraftState,
  type WorkflowDraftDocument
} from "../../../features/workflow-design";
import { type DraftState } from "../../../shared/drafts";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const WorkflowCreatePage = () => {
  const { t } = useLanguage();
  const { signOutCurrentSession, state } = useSession();
  const [draftState, setDraftState] = useState<DraftState<WorkflowDraftDocument> | null>(
    null
  );
  const [configurationDirectory, setConfigurationDirectory] =
    useState<WorkflowConfigurationDirectory | null>(null);

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

  const canAuthor = canCreateWorkflow(state.context.membership.role);

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href={protectedEntryPath}>{t("app.nav.work")}</a>
      <div className="language-selector">
        <LanguageSelector />
        <button className="button" data-variant="secondary" type="button" onClick={() => void signOutCurrentSession()}>
          {t("auth.signOut")}
        </button>
      </div>
    </header>
    <main className="app-main">
      <section className="page-heading" aria-labelledby="workflow-create-page-title">
        <p className="eyebrow">{t("workflowDesign.create.eyebrow")}</p>
        <h1 id="workflow-create-page-title">{t("workflowDesign.create.title")}</h1>
        <p className="lede">{t("workflowDesign.create.lede")}</p>
      </section>
      {canAuthor ? <>
        <aside className="workflow-authoring-notice" role="note" aria-labelledby="workflow-authoring-notice-title">
          <h2 id="workflow-authoring-notice-title">{t("workflowDesign.authoring.narrowTitle")}</h2>
          <p>{t("workflowDesign.authoring.narrowBody")}</p>
        </aside>
        <div className="workflow-authoring-surface">
          <WorkflowCreateForm
            onBackHref={protectedEntryPath}
            onCreated={(accepted) => {
              setDraftState(createWorkflowDraftState(accepted));
              setConfigurationDirectory(accepted.configurationDirectory);
            }}
          />
          {draftState && configurationDirectory ? <WorkflowDraftEditor
            configurationDirectory={configurationDirectory}
            draftState={draftState}
            onAccepted={(acceptedDraftState, accepted) => {
              setDraftState(acceptedDraftState);
              setConfigurationDirectory(accepted.configurationDirectory);
            }}
          /> : null}
        </div>
      </> : <section className="status-panel" aria-labelledby="workflow-design-forbidden-title">
        <h2 id="workflow-design-forbidden-title">{t("authority.title")}</h2>
        <p>{t("authority.accessDenied")}</p>
      </section>}
    </main>
  </div>;
};
