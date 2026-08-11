import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  formatDateTimeInTimeZone,
  readProcessDetailDocument,
  type ProcessDetailDocument
} from "../../../features/my-work";
import { moviqoQueryKeys } from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import {
  Alert,
  Breadcrumbs,
  Button,
  Card,
  isUnmodifiedPrimaryClick,
  PageHeader
} from "../../../shared/ui";

type ProcessDetailPageProps = {
  processId: string;
};

const timelineMessageKeyByKind = {
  "workflow-runtime.process-completed": "processDetail.event.processCompleted",
  "workflow-runtime.process-started": "processDetail.event.processStarted",
  "workflow-runtime.task-completed": "processDetail.event.taskCompleted",
  "workflow-runtime.task-draft-saved": "processDetail.event.taskProgressSaved"
} as const;

export const resolveProcessDetailPageView = (
  loadStatus: "loading" | "error" | "ready",
  document: ProcessDetailDocument | null
) => {
  if (loadStatus === "error") return "error";
  if (loadStatus === "loading" || !document) return "loading";
  return "ready";
};

export const ProcessDetailPage = ({ processId }: ProcessDetailPageProps) => {
  const { t } = useLanguage();
  const { state } = useSession();
  const navigate = useNavigate();
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const query = useQuery({
    enabled: Boolean(organizationId && processId),
    queryKey: moviqoQueryKeys.processDetail(organizationId, processId),
    queryFn: async () => {
      const result = await readProcessDetailDocument(processId);
      if (!result.ok) throw result.error;
      return result.data;
    }
  });

  if (state.status !== "authenticated" || query.isPending) {
    return <Alert announcement="polite">{t("processDetail.loading")}</Alert>;
  }

  if (query.isError) {
    return (
      <Alert announcement="assertive" title={t("processDetail.loadError")} tone="error">
        <Button variant="secondary" onClick={() => void query.refetch()}>
          {t("processDetail.retry")}
        </Button>
      </Alert>
    );
  }

  const detailDocument = query.data;
  const timeZone = state.context.membership.organizationTimezone;

  return (
    <div className="grid gap-moviqo-6">
      <Breadcrumbs
        items={[
          { href: "/my-work/processes", label: t("myWork.myProcesses.title") },
          { current: true, label: detailDocument.header.workflowName }
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
          <Button variant="secondary" onClick={() => navigate("/my-work/processes")}>
            {t("processDetail.back")}
          </Button>
        )}
        description={t("processDetail.title")}
        eyebrow={t("processDetail.eyebrow")}
        title={detailDocument.header.workflowName}
      />
      <Card>
        <p>{`${t("processDetail.reference")} ${detailDocument.header.processNumber}`}</p>
        <p>{`${t("processDetail.version")} ${detailDocument.header.workflowVersionNumber}`}</p>
        <p>{`${t("processDetail.status")} ${detailDocument.header.systemStatus}`}</p>
        <p>{`${t("processDetail.step")} ${detailDocument.header.currentStep}`}</p>
        <p>{`${t("processDetail.startedAt")} ${formatDateTimeInTimeZone(detailDocument.header.startedAt, timeZone)}`}</p>
        {detailDocument.header.completedAt ? (
          <p>{`${t("processDetail.completedAt")} ${formatDateTimeInTimeZone(detailDocument.header.completedAt, timeZone)}`}</p>
        ) : null}
        <p>{`${t("processDetail.lastActivity")} ${formatDateTimeInTimeZone(detailDocument.header.lastActivityAt, timeZone)}`}</p>
        <p>{`${t("processDetail.contribution")} ${detailDocument.header.contributionSummary.label}`}</p>
      </Card>
      <section className="grid gap-moviqo-4" aria-labelledby="process-timeline-title">
        <h2 id="process-timeline-title">{t("processDetail.timelineTitle")}</h2>
        {detailDocument.timeline.length === 0 ? (
          <Alert announcement="polite">{t("processDetail.timelineEmpty")}</Alert>
        ) : (
          <ol className="grid gap-moviqo-3">
            {detailDocument.timeline.map((event) => (
              <li key={`${event.eventKind}-${event.occurredAt}`}>
                <strong>{event.eventKind in timelineMessageKeyByKind
                  ? t(timelineMessageKeyByKind[event.eventKind as keyof typeof timelineMessageKeyByKind])
                  : event.label}</strong>
                <span>{event.actorDisplay}</span>
                <span>{event.taskPosition}</span>
                <span>{formatDateTimeInTimeZone(event.occurredAt, timeZone)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
