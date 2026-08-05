import { useState, type ReactNode } from "react";
import type { QuerySnapshot } from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import type {
  MyWorkCollection,
  MyWorkDashboard,
  MyWorkProcess,
  MyWorkRegion,
  MyWorkStartWorkflow,
  MyWorkTask
} from "../model/myWork";

type MyWorkShellProps = {
  snapshot: QuerySnapshot<MyWorkDashboard>;
  onRetry(): void;
  onStartWorkflow(workflowId: string): void;
  startFeedbackByWorkflowId: Record<string, string | undefined>;
  startingWorkflowId: string | null;
  workflowCreationHref?: string | null;
  showWorkflowCreation: boolean;
};

type Translate = ReturnType<typeof useLanguage>["t"];

const regionOrder: MyWorkRegion[] = ["myTasks", "startWorkflows", "myProcesses"];
const toProcessReference = (processId: string) => processId.slice(0, 8);
const statusLabelFor = (status: string, t: Translate) => {
  if (status === "assigned") {
    return t("status.assigned");
  }
  if (status === "in_progress") {
    return t("status.inProgress");
  }
  return status;
};

export const MyWorkShell = ({
  snapshot,
  onStartWorkflow,
  onRetry,
  startFeedbackByWorkflowId,
  startingWorkflowId,
  workflowCreationHref,
  showWorkflowCreation
}: MyWorkShellProps) => {
  const { t } = useLanguage();
  const [activeRegion, setActiveRegion] = useState<MyWorkRegion>("myTasks");

  return <section className="my-work-shell" aria-labelledby="my-work-title">
    <div className="page-heading">
      <p className="eyebrow">{t("myWork.eyebrow")}</p>
      <h1 id="my-work-title">{t("myWork.title")}</h1>
      <p className="lede">{t("myWork.lede")}</p>
      {showWorkflowCreation && workflowCreationHref ? <div className="button-row">
        <a className="button" href={workflowCreationHref}>
          {t("workflowDesign.create.cta")}
        </a>
      </div> : null}
    </div>
    <nav className="my-work-nav" aria-label={t("myWork.regionNav")}>
      {regionOrder.map((region) => <a
        key={region}
        className="my-work-nav__link"
        data-active={activeRegion === region}
        href={`#my-work-${region}`}
        aria-current={activeRegion === region ? "page" : undefined}
        onClick={() => setActiveRegion(region)}
      >
        {labelForRegion(region, t)}
      </a>)}
    </nav>
    <div className="my-work-grid">
      <MyWorkRegionSection
        id="my-work-myTasks"
        title={t("myWork.myTasks.title")}
        summary={t("myWork.myTasks.summary")}
        isActive={activeRegion === "myTasks"}
      >
        {renderMyTasks(snapshot, onRetry, t)}
      </MyWorkRegionSection>
      <MyWorkRegionSection
        id="my-work-startWorkflows"
        title={t("myWork.startWorkflows.title")}
        summary={t("myWork.startWorkflows.summary")}
        isActive={activeRegion === "startWorkflows"}
      >
        {renderStartWorkflows(
          snapshot,
          onRetry,
          onStartWorkflow,
          startFeedbackByWorkflowId,
          startingWorkflowId,
          t
        )}
      </MyWorkRegionSection>
      <MyWorkRegionSection
        id="my-work-myProcesses"
        title={t("myWork.myProcesses.title")}
        summary={t("myWork.myProcesses.summary")}
        isActive={activeRegion === "myProcesses"}
      >
        {renderMyProcesses(snapshot, onRetry, t)}
      </MyWorkRegionSection>
    </div>
  </section>;
};

const MyWorkRegionSection = ({
  children,
  id,
  isActive,
  summary,
  title
}: {
  children: ReactNode;
  id: string;
  isActive: boolean;
  summary: string;
  title: string;
}) => {
  return <section className="my-work-panel" data-active={isActive} aria-labelledby={`${id}-title`}>
    <div className="my-work-panel__heading">
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{summary}</p>
    </div>
    {children}
  </section>;
};

const labelForRegion = (region: MyWorkRegion, t: Translate) => {
  return ({
    myTasks: t("myWork.myTasks.title"),
    startWorkflows: t("myWork.startWorkflows.title"),
    myProcesses: t("myWork.myProcesses.title")
  })[region];
};

const renderMyTasks = (
  snapshot: QuerySnapshot<MyWorkDashboard>,
  onRetry: () => void,
  t: Translate
) => {
  return renderRegionState<MyWorkTask>(
    snapshot,
    t("myWork.myTasks.empty"),
    t("myWork.error"),
    t("myWork.loading"),
    t("myWork.retry"),
    onRetry,
    (item) => <article key={item.taskId} className="my-work-card">
      <h3>{item.title}</h3>
      <p>{item.workflowName}</p>
      <p>{`${t("myWork.myTasks.status")} ${statusLabelFor(item.status, t)}`}</p>
      <p>{`${t("myWork.myTasks.process")} ${toProcessReference(item.processId)}`}</p>
      <div className="button-row">
        <a className="button" href={item.openTaskRoute}>
          {t("myWork.myTasks.open")}
        </a>
      </div>
    </article>,
    (dashboard) => dashboard.myTasks
  );
};

const renderStartWorkflows = (
  snapshot: QuerySnapshot<MyWorkDashboard>,
  onRetry: () => void,
  onStartWorkflow: (workflowId: string) => void,
  startFeedbackByWorkflowId: Record<string, string | undefined>,
  startingWorkflowId: string | null,
  t: Translate
) => {
  return renderRegionState<MyWorkStartWorkflow>(
    snapshot,
    t("myWork.startWorkflows.empty"),
    t("myWork.error"),
    t("myWork.loading"),
    t("myWork.retry"),
    onRetry,
    (item) => <article key={item.workflowId} className="my-work-card">
      <h3>{item.title}</h3>
      <p>{`${t("myWork.startWorkflows.version")} ${item.versionNumber}`}</p>
      {item.description ? <p>{item.description}</p> : null}
      <p>{item.availability}</p>
      <div className="button-row">
        <button
          className="button"
          type="button"
          disabled={startingWorkflowId === item.workflowId}
          onClick={() => onStartWorkflow(item.workflowId)}
        >
          {startingWorkflowId === item.workflowId
            ? t("myWork.startWorkflows.starting")
            : t("myWork.startWorkflows.start")}
        </button>
      </div>
      {startFeedbackByWorkflowId[item.workflowId] ? (
        <p role="status">{startFeedbackByWorkflowId[item.workflowId]}</p>
      ) : null}
    </article>,
    (dashboard) => dashboard.startWorkflows
  );
};

const renderMyProcesses = (
  snapshot: QuerySnapshot<MyWorkDashboard>,
  onRetry: () => void,
  t: Translate
) => {
  return renderRegionState<MyWorkProcess>(
    snapshot,
    t("myWork.myProcesses.empty"),
    t("myWork.error"),
    t("myWork.loading"),
    t("myWork.retry"),
    onRetry,
    (item) => <article key={item.processId} className="my-work-card">
      <h3>{item.workflowName}</h3>
      <p>{item.systemStatus}</p>
      <p>{item.instanceState}</p>
      <p>{item.currentStep}</p>
      <p>{item.involvement}</p>
    </article>,
    (dashboard) => dashboard.myProcesses
  );
};

const renderRegionState = <TItem,>(
  snapshot: QuerySnapshot<MyWorkDashboard>,
  emptyMessage: string,
  errorMessage: string,
  loadingMessage: string,
  retryLabel: string,
  onRetry: () => void,
  renderItem: (item: TItem) => ReactNode,
  selectCollection: (dashboard: MyWorkDashboard) => MyWorkCollection<TItem>
) => {
  if (snapshot.status === "idle" || snapshot.status === "loading") {
    return <p className="status-panel" role="status">{loadingMessage}</p>;
  }

  if (snapshot.status === "error") {
    return <div className="status-panel" role="alert">
      <p>{errorMessage}</p>
      <button className="button" type="button" onClick={onRetry}>{retryLabel}</button>
    </div>;
  }

  const collection = selectCollection(snapshot.data);
  if (collection.items.length === 0) {
    return <p className="status-panel" role="status">{emptyMessage}</p>;
  }

  return <div className="my-work-cards">{collection.items.map(renderItem)}</div>;
};
