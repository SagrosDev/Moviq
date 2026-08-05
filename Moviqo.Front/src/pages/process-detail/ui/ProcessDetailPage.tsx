import { useEffect, useState } from "react";
import { protectedEntryPath, useSession } from "../../../features/authentication";
import {
  formatDateTimeInTimeZone,
  readProcessDetailDocument,
  type ProcessDetailDocument
} from "../../../features/my-work";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

type ProcessDetailPageProps = {
  processId: string;
};

export const resolveProcessDetailPageView = (
  loadStatus: "loading" | "error" | "ready",
  document: ProcessDetailDocument | null
) => {
  if (loadStatus === "error") {
    return "error";
  }
  if (loadStatus === "loading" || !document) {
    return "loading";
  }
  return "ready";
};

export const ProcessDetailPage = ({ processId }: ProcessDetailPageProps) => {
  const { t } = useLanguage();
  const { signOutCurrentSession, state } = useSession();
  const [document, setDocument] = useState<ProcessDetailDocument | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    if (state.status === "anonymous") {
      window.location.assign("/sign-in");
    }
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "authenticated") {
      return;
    }

    const load = async () => {
      setLoadStatus("loading");
      const result = await readProcessDetailDocument(processId);
      if (!result.ok) {
        setLoadStatus("error");
        return;
      }
      setDocument(result.data);
      setLoadStatus("ready");
    };

    void load();
  }, [processId, state.status]);

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

  const retry = async () => {
    const result = await readProcessDetailDocument(processId);
    if (!result.ok) {
      setLoadStatus("error");
      return;
    }
    setDocument(result.data);
    setLoadStatus("ready");
  };

  const pageView = resolveProcessDetailPageView(loadStatus, document);
  const detailDocument = pageView === "ready" ? document : null;
  const organizationTimeZone = state.context.membership.organizationTimezone;

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
      <div className="button-row">
        <a className="button" data-variant="secondary" href={protectedEntryPath}>{t("processDetail.back")}</a>
      </div>
      {pageView === "loading" ? (
        <p className="status-panel" role="status">{t("processDetail.loading")}</p>
      ) : pageView === "error" ? (
        <div className="status-panel" role="alert">
          <p>{t("processDetail.loadError")}</p>
          <button className="button" type="button" onClick={() => void retry()}>{t("processDetail.retry")}</button>
        </div>
      ) : detailDocument ? (
        <section className="my-work-shell" aria-labelledby="process-detail-title">
          <div className="page-heading">
            <p className="eyebrow">{t("processDetail.eyebrow")}</p>
            <h1 id="process-detail-title">{detailDocument.header.workflowName}</h1>
            <p className="lede">{t("processDetail.title")}</p>
          </div>
          <article className="my-work-card">
            <p>{`${t("processDetail.reference")} ${detailDocument.header.processNumber}`}</p>
            <p>{`${t("processDetail.version")} ${detailDocument.header.workflowVersionNumber}`}</p>
            <p>{`${t("processDetail.status")} ${detailDocument.header.systemStatus}`}</p>
            <p>{`${t("processDetail.step")} ${detailDocument.header.currentStep}`}</p>
            <p>{`${t("processDetail.startedAt")} ${formatDateTimeInTimeZone(detailDocument.header.startedAt, organizationTimeZone)}`}</p>
            {detailDocument.header.completedAt ? (
              <p>{`${t("processDetail.completedAt")} ${formatDateTimeInTimeZone(detailDocument.header.completedAt, organizationTimeZone)}`}</p>
            ) : null}
            <p>{`${t("processDetail.lastActivity")} ${formatDateTimeInTimeZone(detailDocument.header.lastActivityAt, organizationTimeZone)}`}</p>
            <p>{`${t("processDetail.contribution")} ${detailDocument.header.contributionSummary.label}`}</p>
          </article>
          <section className="timeline" aria-labelledby="process-timeline-title">
            <div className="my-work-panel__heading">
              <h2 id="process-timeline-title">{t("processDetail.timelineTitle")}</h2>
            </div>
            {detailDocument.timeline.length === 0 ? (
              <p className="status-panel" role="status">{t("processDetail.timelineEmpty")}</p>
            ) : (
              <ol>
                {detailDocument.timeline.map((event) => (
                  <li key={`${event.eventKind}-${event.occurredAt}`}>
                    <strong>{event.label}</strong>
                    <span>{event.actorDisplay}</span>
                    <span>{event.taskPosition}</span>
                    <span>{formatDateTimeInTimeZone(event.occurredAt, organizationTimeZone)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>
      ) : null}
    </main>
  </div>;
};
