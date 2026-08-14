import { useState, type MouseEvent, type ReactNode } from "react";
import {
  isSessionExpiryProblem,
  type NormalizedApiProblem,
  type QuerySnapshot
} from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import { Button, ButtonLink, LoadingState, TextInput } from "../../../shared/ui";
import type {
  MyProcessesQuery,
  MyWorkCollection,
  MyWorkDashboard,
  MyWorkProcess,
  MyWorkRegion,
  MyWorkStartWorkflow,
  MyWorkTask
} from "../model/myWork";
import { formatDateTimeInTimeZone } from "../model/myWork";
import {
  processContributionLabelFor,
  processInvolvementLabelFor,
  processPositionLabelFor
} from "./processPresentation";

type MyWorkShellProps = {
  snapshot: QuerySnapshot<MyWorkDashboard, NormalizedApiProblem>;
  onRetry(): void;
  onStartWorkflow(workflowId: string): void;
  startFeedbackByWorkflowId: Record<string, string | undefined>;
  startingWorkflowId: string | null;
  workflowCreationHref?: string | null;
  showWorkflowCreation: boolean;
  myProcessesQuery: MyProcessesQuery;
  myTasksSearchDraft: string;
  myProcessesSearchDraft: string;
  myProcessesTimeZone: string;
  onMyProcessesSearchChange(value: string): void;
  onMyProcessesSearchSubmit(): void;
  onMyTasksSearchChange(value: string): void;
  onMyTasksSearchSubmit(): void;
  onMyProcessesPageChange(page: number): void;
  onMyTasksPageChange(page: number): void;
  onStartWorkflowsPageChange(page: number): void;
  regions?: readonly MyWorkRegion[];
  showHeading?: boolean;
  showRegionNavigation?: boolean;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
};

type Translate = ReturnType<typeof useLanguage>["t"];
type MyWorkSnapshot = QuerySnapshot<MyWorkDashboard, NormalizedApiProblem>;

const regionOrder: MyWorkRegion[] = ["myTasks", "startWorkflows", "myProcesses"];
const toProcessReference = (processId: string) => processId.slice(0, 8);
const statusLabelFor = (status: string, t: Translate) => {
  if (status === "assigned") {
    return t("status.assigned");
  }
  if (status === "in_progress") {
    return t("status.inProgress");
  }
  if (status === "completed") {
    return t("status.completed");
  }
  return status;
};

const errorMessageFor = (
  snapshot: MyWorkSnapshot,
  region: MyWorkRegion,
  t: Translate
) => {
  if (snapshot.status !== "error") {
    return t("myWork.error");
  }
  if (isSessionExpiryProblem(snapshot.error.status, snapshot.error.code)) {
    return t("myWork.sessionExpired");
  }
  if (snapshot.error.code === "permission_denied") {
    return t("myWork.permissionDenied");
  }
  if (snapshot.error.status === 0) {
    return t("myWork.networkError");
  }
  return ({
    myTasks: t("myWork.myTasks.unavailable"),
    startWorkflows: t("myWork.startWorkflows.unavailable"),
    myProcesses: t("myWork.myProcesses.unavailable")
  })[region];
};

const canRetryMyWorkError = (snapshot: MyWorkSnapshot) => (
  snapshot.status === "error"
  && !isSessionExpiryProblem(snapshot.error.status, snapshot.error.code)
  && snapshot.error.code !== "permission_denied"
);

const isMissingMyWork = (snapshot: MyWorkSnapshot) => (
  snapshot.status === "error"
  && (snapshot.error.code === "resource_not_found" || snapshot.error.status === 404)
);

export const MyWorkShell = ({
  snapshot,
  onStartWorkflow,
  onRetry,
  startFeedbackByWorkflowId,
  startingWorkflowId,
  workflowCreationHref,
  showWorkflowCreation,
  myProcessesQuery,
  myTasksSearchDraft,
  myProcessesSearchDraft,
  myProcessesTimeZone,
  onMyProcessesSearchChange,
  onMyProcessesSearchSubmit,
  onMyTasksSearchChange,
  onMyTasksSearchSubmit,
  onMyProcessesPageChange,
  onMyTasksPageChange,
  onStartWorkflowsPageChange,
  regions = regionOrder,
  showHeading = true,
  showRegionNavigation = true,
  onNavigate
}: MyWorkShellProps) => {
  const { t } = useLanguage();
  const [activeRegion, setActiveRegion] = useState<MyWorkRegion>("myTasks");

  const dedicatedRegionLabel = regions.length === 1
    ? labelForRegion(regions[0] ?? "myTasks", t)
    : t("myWork.title");

  return <section
    className="my-work-shell"
    aria-label={showHeading ? undefined : dedicatedRegionLabel}
    aria-labelledby={showHeading ? "my-work-title" : undefined}
  >
    {showHeading ? <div className="page-heading">
      <h1 id="my-work-title">{t("myWork.title")}</h1>
      <p className="lede">{t("myWork.lede")}</p>
      {showWorkflowCreation && workflowCreationHref ? <div className="button-row">
        <a className="button" href={workflowCreationHref}>
          {t("workflowDesign.create.cta")}
        </a>
      </div> : null}
    </div> : null}
    {showRegionNavigation ? <nav className="my-work-nav" aria-label={t("myWork.regionNav")}>
      {regions.map((region) => <a
        key={region}
        className="my-work-nav__link"
        data-active={activeRegion === region}
        href={`#my-work-${region}`}
        aria-current={activeRegion === region ? "page" : undefined}
        onClick={() => setActiveRegion(region)}
      >
        {labelForRegion(region, t)}
      </a>)}
    </nav> : null}
    <div className="my-work-grid">
      {regions.includes("myTasks") ? <MyWorkRegionSection
        id="my-work-myTasks"
        title={t("myWork.myTasks.title")}
        summary={t("myWork.myTasks.summary")}
        isActive={activeRegion === "myTasks"}
      >
        {renderMyTasks(
          snapshot,
          onRetry,
          t,
          myProcessesQuery,
          myTasksSearchDraft,
          onMyTasksSearchChange,
          onMyTasksSearchSubmit,
          onMyTasksPageChange,
          onNavigate
        )}
      </MyWorkRegionSection> : null}
      {regions.includes("startWorkflows") ? <MyWorkRegionSection
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
          t,
          myProcessesQuery.startWorkflowsPage,
          onStartWorkflowsPageChange,
          showWorkflowCreation,
          workflowCreationHref,
          onNavigate
        )}
      </MyWorkRegionSection> : null}
      {regions.includes("myProcesses") ? <MyWorkRegionSection
        id="my-work-myProcesses"
        title={t("myWork.myProcesses.title")}
        summary={t("myWork.myProcesses.summary")}
        isActive={activeRegion === "myProcesses"}
      >
        {renderMyProcesses(
          snapshot,
          onRetry,
          t,
          myProcessesQuery,
          myProcessesSearchDraft,
          myProcessesTimeZone,
          onMyProcessesSearchChange,
          onMyProcessesSearchSubmit,
          onMyProcessesPageChange,
          onNavigate
        )}
      </MyWorkRegionSection> : null}
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
  snapshot: MyWorkSnapshot,
  onRetry: () => void,
  t: Translate,
  query: MyProcessesQuery,
  searchDraft: string,
  onSearchChange: (value: string) => void,
  onSearchSubmit: () => void,
  onPageChange: (page: number) => void,
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void
) => {
  if (snapshot.status === "idle" || snapshot.status === "loading") {
    return <LoadingState>{t("myWork.myTasks.loading")}</LoadingState>;
  }

  const controls = <form
    className="my-work-search"
    onSubmit={(event) => {
      event.preventDefault();
      onSearchSubmit();
    }}
  >
    <TextInput
      id="my-tasks-search"
      label={t("myWork.myTasks.searchLabel")}
      type="search"
      value={searchDraft}
      placeholder={t("myWork.myTasks.searchPlaceholder")}
      onChange={(event) => onSearchChange(event.target.value)}
    />
    <Button type="submit" width="full">
      {t("myWork.myTasks.searchAction")}
    </Button>
  </form>;
  const content = renderRegionState<MyWorkTask>(
    snapshot,
    query.taskSearch
      ? t("myWork.myTasks.noMatches")
      : t("myWork.myTasks.empty"),
    errorMessageFor(snapshot, "myTasks", t),
    t("myWork.myTasks.loading"),
    t("myWork.retry"),
    onRetry,
    (item) => <article key={item.taskId} className="my-work-card">
      <h3>{item.title}</h3>
      <p>{item.workflowName}</p>
      <p>{`${t("myWork.myTasks.status")} ${statusLabelFor(item.status, t)}`}</p>
      <p>{`${t("myWork.myTasks.process")} ${toProcessReference(item.processId)}`}</p>
      <div className="button-row">
        <ButtonLink
          href={item.openTaskRoute}
          onClick={(event) => onNavigate?.(item.openTaskRoute, event)}
        >
          {t("myWork.myTasks.open")}
        </ButtonLink>
      </div>
    </article>,
    (dashboard) => dashboard.myTasks,
    (collection) => renderCollectionPagination(
      query.myTasksPage,
      collection.hasMore,
      onPageChange,
      t
    )
  );
  return <div>{controls}{content}</div>;
};

const renderStartWorkflows = (
  snapshot: MyWorkSnapshot,
  onRetry: () => void,
  onStartWorkflow: (workflowId: string) => void,
  startFeedbackByWorkflowId: Record<string, string | undefined>,
  startingWorkflowId: string | null,
  t: Translate,
  page: number,
  onPageChange: (page: number) => void,
  showWorkflowCreation: boolean,
  workflowCreationHref?: string | null,
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void
) => {
  if (startingWorkflowId !== null) {
    return <LoadingState>{t("myWork.startWorkflows.starting")}</LoadingState>;
  }

  return renderRegionState<MyWorkStartWorkflow>(
    snapshot,
    <div className="status-panel" role="status">
      <strong>{showWorkflowCreation
        ? t("myWork.startWorkflows.emptyAuthor")
        : t("myWork.startWorkflows.emptyMember")}</strong>
      <p>{t("myWork.startWorkflows.emptyHelp")}</p>
      {showWorkflowCreation && workflowCreationHref ? (
        <ButtonLink
          href={workflowCreationHref}
          onClick={(event) => onNavigate?.(workflowCreationHref, event)}
        >
          {t("workflowCatalog.create")}
        </ButtonLink>
      ) : null}
    </div>,
    errorMessageFor(snapshot, "startWorkflows", t),
    t("myWork.startWorkflows.loading"),
    t("myWork.retry"),
    onRetry,
    (item) => <article key={item.workflowId} className="my-work-card">
      <h3>{item.title}</h3>
      <p>{`${t("myWork.startWorkflows.version")} ${item.versionNumber}`}</p>
      {item.description ? <p>{item.description}</p> : null}
      <p>{item.availability}</p>
      <div className="button-row">
        <Button
          onClick={() => onStartWorkflow(item.workflowId)}
        >
          {t("myWork.startWorkflows.start")}
        </Button>
      </div>
      {startFeedbackByWorkflowId[item.workflowId] ? (
        <p role="status">{startFeedbackByWorkflowId[item.workflowId]}</p>
      ) : null}
    </article>,
    (dashboard) => dashboard.startWorkflows,
    (collection) => renderCollectionPagination(page, collection.hasMore, onPageChange, t)
  );
};

const renderMyProcesses = (
  snapshot: MyWorkSnapshot,
  onRetry: () => void,
  t: Translate,
  query: MyProcessesQuery,
  searchDraft: string,
  timeZone: string,
  onSearchChange: (value: string) => void,
  onSearchSubmit: () => void,
  onPageChange: (page: number) => void,
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void
) => {
  if (snapshot.status === "idle" || snapshot.status === "loading") {
    return <LoadingState>{t("myWork.myProcesses.loading")}</LoadingState>;
  }

  const controls = <div>
    <form
      className="my-work-search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearchSubmit();
      }}
    >
      <TextInput
        id="my-processes-search"
        label={t("myWork.myProcesses.searchLabel")}
        type="search"
        value={searchDraft}
        placeholder={t("myWork.myProcesses.searchPlaceholder")}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <Button type="submit" width="full">
        {t("myWork.myProcesses.searchAction")}
      </Button>
    </form>
    <p>{t("myWork.myProcesses.discoveryHint")}</p>
  </div>;

  if (snapshot.status === "error") {
    if (isMissingMyWork(snapshot)) {
      return <div>
        {controls}
        <p className="status-panel" role="status">
          {query.search
            ? t("myWork.myProcesses.noMatches")
            : t("myWork.myProcesses.empty")}
        </p>
      </div>;
    }
    return <div>
      {controls}
      <div className="status-panel" role="alert" data-error-code={snapshot.error.code}>
        <p>{errorMessageFor(snapshot, "myProcesses", t)}</p>
        {canRetryMyWorkError(snapshot) ? (
          <Button onClick={onRetry}>{t("myWork.retry")}</Button>
        ) : null}
      </div>
    </div>;
  }

  const collection = snapshot.data.myProcesses;
  const hasPreviousPage = query.page > 1;
  const hasNextPage = collection.hasMore;

  return <div>
    {controls}
    {collection.items.length === 0 ? (
      <p className="status-panel" role="status">
        {query.search
          ? t("myWork.myProcesses.noMatches")
          : t("myWork.myProcesses.empty")}
      </p>
    ) : (
      <>
        <div
          className="hidden max-w-full overflow-x-auto rounded-moviqo-control border border-moviqo-border focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus desktop:block"
          data-process-layout="table"
          role="region"
          aria-label={t("myWork.myProcesses.tableRegion")}
          tabIndex={0}
        >
          <table className="w-full border-collapse">
            <caption className="sr-only">{t("myWork.myProcesses.title")}</caption>
            <thead>
              <tr>
                <th className="border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold" scope="col">{t("myWork.myProcesses.workflowColumn")}</th>
                <th className="border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold" scope="col">{t("myWork.myProcesses.referenceColumn")}</th>
                <th className="border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold" scope="col">{t("myWork.myProcesses.statusColumn")}</th>
                <th className="border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold" scope="col">{t("myWork.myProcesses.stepColumn")}</th>
                <th className="border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold" scope="col">{t("myWork.myProcesses.involvementColumn")}</th>
                <th className="border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold" scope="col">{t("myWork.myProcesses.lastActivityColumn")}</th>
                <th className="border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold" scope="col">{t("myWork.myProcesses.actionsColumn")}</th>
              </tr>
            </thead>
            <tbody>
              {collection.items.map((item) => <tr key={item.processId}>
                <th className="border-b border-moviqo-border p-moviqo-3 text-left align-top font-semibold" scope="row">{item.workflowName}</th>
                <td className="border-b border-moviqo-border p-moviqo-3 align-top">{item.processNumber}</td>
                <td className="border-b border-moviqo-border p-moviqo-3 align-top">{statusLabelFor(item.systemStatus, t)}</td>
                <td className="border-b border-moviqo-border p-moviqo-3 align-top">
                  {processPositionLabelFor(item.currentStep, item.currentStepKind, t)}
                </td>
                <td className="border-b border-moviqo-border p-moviqo-3 align-top">
                  <span>{processInvolvementLabelFor(item.involvement, t)}</span>
                  <small className="mt-moviqo-1 block text-moviqo-ink-secondary">
                    {processContributionLabelFor(item.contributionSummary, t)}
                  </small>
                </td>
                <td className="border-b border-moviqo-border p-moviqo-3 align-top">{formatDateTimeInTimeZone(item.completedAt ?? item.lastActivityAt, timeZone)}</td>
                <td className="border-b border-moviqo-border p-moviqo-3 align-top">
                  <ButtonLink
                    href={item.viewRoute}
                    variant="secondary"
                    onClick={(event) => onNavigate?.(item.viewRoute, event)}
                  >
                    {t("myWork.myProcesses.view")}
                  </ButtonLink>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div
          className="grid min-w-0 gap-moviqo-3 break-words desktop:hidden"
          data-process-layout="cards"
        >
          {collection.items.map((item) => <article key={item.processId} className="my-work-card">
          <h3>{item.workflowName}</h3>
          <p>{`${t("myWork.myProcesses.reference")} ${item.processNumber}`}</p>
          <p>{`${t("myWork.myProcesses.status")} ${statusLabelFor(item.systemStatus, t)}`}</p>
          <p>{`${t("myWork.myProcesses.step")} ${processPositionLabelFor(
            item.currentStep,
            item.currentStepKind,
            t
          )}`}</p>
          <p>{`${t("myWork.myProcesses.involvement")} ${processInvolvementLabelFor(item.involvement, t)}`}</p>
          <p>{`${t("myWork.myProcesses.lastActivity")} ${formatDateTimeInTimeZone(item.completedAt ?? item.lastActivityAt, timeZone)}`}</p>
          <p>{processContributionLabelFor(item.contributionSummary, t)}</p>
          <div className="button-row">
            <ButtonLink
              href={item.viewRoute}
              variant="secondary"
              onClick={(event) => onNavigate?.(item.viewRoute, event)}
            >
              {t("myWork.myProcesses.view")}
            </ButtonLink>
          </div>
        </article>)}
        </div>
      </>
    )}
    <div className="button-row">
      <Button
        variant="secondary"
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(query.page - 1)}
      >
        {t("myWork.myProcesses.previousPage")}
      </Button>
      <Button
        variant="secondary"
        disabled={!hasNextPage}
        onClick={() => onPageChange(query.page + 1)}
      >
        {t("myWork.myProcesses.nextPage")}
      </Button>
    </div>
  </div>;
};

const renderRegionState = <TItem,>(
  snapshot: MyWorkSnapshot,
  emptyContent: ReactNode,
  errorMessage: string,
  loadingMessage: string,
  retryLabel: string,
  onRetry: () => void,
  renderItem: (item: TItem) => ReactNode,
  selectCollection: (dashboard: MyWorkDashboard) => MyWorkCollection<TItem>,
  renderFooter?: (collection: MyWorkCollection<TItem>) => ReactNode
) => {
  if (snapshot.status === "idle" || snapshot.status === "loading") {
    return <LoadingState>{loadingMessage}</LoadingState>;
  }

  if (snapshot.status === "error") {
    if (isMissingMyWork(snapshot)) {
      return typeof emptyContent === "string" ? (
        <p className="status-panel" role="status">{emptyContent}</p>
      ) : emptyContent;
    }
    return <div className="status-panel" role="alert" data-error-code={snapshot.error.code}>
      <p>{errorMessage}</p>
      {canRetryMyWorkError(snapshot) ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
    </div>;
  }

  const collection = selectCollection(snapshot.data);
  if (collection.items.length === 0) {
    return <>
      {typeof emptyContent === "string" ? (
        <p className="status-panel" role="status">{emptyContent}</p>
      ) : emptyContent}
      {renderFooter?.(collection)}
    </>;
  }

  return <>
    <div className="my-work-cards">{collection.items.map(renderItem)}</div>
    {renderFooter?.(collection)}
  </>;
};

const renderCollectionPagination = (
  page: number,
  hasMore: boolean,
  onPageChange: (page: number) => void,
  t: Translate
) => <div className="button-row">
  <Button
    variant="secondary"
    disabled={page <= 1}
    onClick={() => onPageChange(page - 1)}
  >
    {t("myWork.myProcesses.previousPage")}
  </Button>
  <Button
    variant="secondary"
    disabled={!hasMore}
    onClick={() => onPageChange(page + 1)}
  >
    {t("myWork.myProcesses.nextPage")}
  </Button>
</div>;
