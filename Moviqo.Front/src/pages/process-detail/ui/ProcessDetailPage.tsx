import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  formatDateTimeInTimeZone,
  processActorLabelFor,
  processContributionLabelFor,
  processPositionLabelFor,
  readProcessDetailDocument,
  type ProcessDetailDocument
} from "../../../features/my-work";
import { moviqoQueryKeys } from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  isUnmodifiedPrimaryClick,
  LoadingState,
  PageHeader
} from "../../../shared/ui";

type ProcessDetailPageProps = {
  processId: string;
};

const timelineMessageKeyByKind = {
  process_completed: "processDetail.event.processCompleted",
  process_started: "processDetail.event.processStarted",
  task_completed: "processDetail.event.taskCompleted",
  task_progress_saved: "processDetail.event.taskProgressSaved",
  "workflow-runtime.process-completed": "processDetail.event.processCompleted",
  "workflow-runtime.process-started": "processDetail.event.processStarted",
  "workflow-runtime.task-completed": "processDetail.event.taskCompleted",
  "workflow-runtime.task-draft-saved": "processDetail.event.taskProgressSaved"
} as const;

const statusLabelFor = (status: string, t: ReturnType<typeof useLanguage>["t"]) => {
  if (status === "completed") return t("status.completed");
  if (status === "active" || status === "in_progress") return t("status.inProgress");
  return status;
};

const DetailItem = ({ term, value }: { term: string; value: ReactNode }) => (
  <div className="grid gap-moviqo-1">
    <dt className="text-sm font-semibold text-moviqo-ink-secondary">{term}</dt>
    <dd className="m-0 min-w-0 wrap-anywhere">{value}</dd>
  </div>
);

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
    return <LoadingState>{t("processDetail.loading")}</LoadingState>;
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
        <div className="flex flex-wrap gap-moviqo-2">
          <Badge tone={detailDocument.header.systemStatus === "completed" ? "success" : "info"}>
            {statusLabelFor(detailDocument.header.systemStatus, t)}
          </Badge>
          <Badge>{processPositionLabelFor(
            detailDocument.header.currentStep,
            detailDocument.header.currentStepKind,
            t
          )}</Badge>
        </div>
        <dl className="m-0 grid gap-moviqo-4 tablet:grid-cols-2 desktop:grid-cols-3">
          <DetailItem term={t("processDetail.reference")} value={detailDocument.header.processNumber} />
          <DetailItem term={t("processDetail.version")} value={detailDocument.header.workflowVersionNumber} />
          <DetailItem
            term={t("processDetail.startedAt")}
            value={formatDateTimeInTimeZone(detailDocument.header.startedAt, timeZone)}
          />
          {detailDocument.header.completedAt ? (
            <DetailItem
              term={t("processDetail.completedAt")}
              value={formatDateTimeInTimeZone(detailDocument.header.completedAt, timeZone)}
            />
          ) : null}
          <DetailItem
            term={t("processDetail.lastActivity")}
            value={formatDateTimeInTimeZone(detailDocument.header.lastActivityAt, timeZone)}
          />
          <DetailItem
            term={t("processDetail.contribution")}
            value={processContributionLabelFor(detailDocument.header.contributionSummary, t)}
          />
        </dl>
      </Card>
      <section className="grid gap-moviqo-4" aria-labelledby="process-timeline-title">
        <h2 id="process-timeline-title">{t("processDetail.timelineTitle")}</h2>
        {detailDocument.timeline.length === 0 ? (
          <Alert announcement="polite">{t("processDetail.timelineEmpty")}</Alert>
        ) : (
          <ol className="m-0 grid list-none gap-moviqo-3 p-0">
            {detailDocument.timeline.map((event) => (
              <li key={`${event.eventKind}-${event.occurredAt}`}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-moviqo-2">
                    <strong>{event.eventKind in timelineMessageKeyByKind
                      ? t(timelineMessageKeyByKind[event.eventKind as keyof typeof timelineMessageKeyByKind])
                      : event.label}</strong>
                    <time
                      className="text-sm text-moviqo-ink-secondary"
                      dateTime={event.occurredAt}
                    >
                      {formatDateTimeInTimeZone(event.occurredAt, timeZone)}
                    </time>
                  </div>
                  <dl className="m-0 grid gap-moviqo-3 tablet:grid-cols-2">
                    <DetailItem
                      term={t("processDetail.actor")}
                      value={processActorLabelFor(
                        event.actorDisplay,
                        event.actorDisplayKind,
                        t
                      )}
                    />
                    <DetailItem
                      term={t("processDetail.taskPosition")}
                      value={processPositionLabelFor(
                        event.taskPosition,
                        event.taskPositionKind,
                        t
                      )}
                    />
                  </dl>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
