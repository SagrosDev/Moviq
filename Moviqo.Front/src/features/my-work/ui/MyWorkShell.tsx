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
  isRefreshing?: boolean;
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
const reportHeadingClasses = "border-b border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 text-left text-moviqo-label font-bold";
const reportCellClasses = "border-b border-moviqo-border p-moviqo-3 text-left align-top wrap-anywhere";

const ReportCardValue = ({ label, value }: { label: string; value: string }) => (
  <div className="grid min-w-0 grid-cols-[minmax(7rem,auto)_minmax(0,1fr)] gap-moviqo-2">
    <dt className="font-semibold text-moviqo-ink-primary">{label}</dt>
    <dd className="m-0 min-w-0 wrap-anywhere text-moviqo-ink-secondary">{value}</dd>
  </div>
);
const statusLabelFor = (status: string, t: Translate) => {
  if (status === "assigned") {
    return t("status.assigned");
  }
  if (status === "in_progress") {
    return t("status.inProgress");
  }
  if (status === "active") {
    return t("status.active");
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
  isRefreshing = false,
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
          myProcessesTimeZone,
          isRefreshing,
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
          isRefreshing,
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
          isRefreshing,
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
  timeZone: string,
  isRefreshing: boolean,
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
  if (snapshot.status === "error") {
    if (isMissingMyWork(snapshot)) {
      return <div>{controls}<p className="status-panel" role="status">
        {query.taskSearch ? t("myWork.myTasks.noMatches") : t("myWork.myTasks.empty")}
      </p></div>;
    }
    return <div>{controls}<div className="status-panel" role="alert" data-error-code={snapshot.error.code}>
      <p>{errorMessageFor(snapshot, "myTasks", t)}</p>
      {canRetryMyWorkError(snapshot) ? <Button onClick={onRetry}>{t("myWork.retry")}</Button> : null}
    </div></div>;
  }

  const collection = snapshot.data.myTasks;
  return <div className="grid gap-moviqo-4" aria-busy={isRefreshing || undefined}>
    {controls}
    {isRefreshing ? <p className="m-0 text-sm font-semibold text-moviqo-primary" role="status">
      {t("myWork.refreshing")}
    </p> : null}
    {collection.items.length === 0 ? (
      <p className="status-panel" role="status">
        {query.taskSearch ? t("myWork.myTasks.noMatches") : t("myWork.myTasks.empty")}
      </p>
    ) : <>
      <div
        className="hidden max-w-full overflow-x-auto rounded-moviqo-control border border-moviqo-border focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus desktop:block"
        data-task-layout="table"
        role="region"
        aria-label={t("myWork.myTasks.tableRegion")}
        tabIndex={0}
      >
        <table className="w-full border-collapse">
          <caption className="sr-only">{t("myWork.myTasks.title")}</caption>
          <thead><tr>
            <th className={reportHeadingClasses} scope="col">{t("myWork.myTasks.taskColumn")}</th>
            <th className={reportHeadingClasses} scope="col">{t("myWork.myTasks.workflowColumn")}</th>
            <th className={reportHeadingClasses} scope="col">{t("myWork.myTasks.processColumn")}</th>
            <th className={reportHeadingClasses} scope="col">{t("myWork.myTasks.statusColumn")}</th>
            <th className={reportHeadingClasses} scope="col">{t("myWork.myTasks.assignedColumn")}</th>
            <th className={reportHeadingClasses} scope="col">{t("myWork.myTasks.actionsColumn")}</th>
          </tr></thead>
          <tbody>{collection.items.map((item) => <tr key={item.taskId}>
            <th className={`${reportCellClasses} font-semibold`} scope="row">{item.title}</th>
            <td className={reportCellClasses}>{item.workflowName}</td>
            <td className={reportCellClasses}>{toProcessReference(item.processId)}</td>
            <td className={reportCellClasses}>{statusLabelFor(item.status, t)}</td>
            <td className={reportCellClasses}>{formatDateTimeInTimeZone(item.activatedAt, timeZone)}</td>
            <td className={reportCellClasses}>
              <ButtonLink
                aria-label={`${t("myWork.myTasks.open")}: ${item.title}`}
                href={item.openTaskRoute}
                variant="secondary"
                onClick={(event) => onNavigate?.(item.openTaskRoute, event)}
              >{t("myWork.myTasks.open")}</ButtonLink>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="grid min-w-0 gap-moviqo-3 break-words desktop:hidden" data-task-layout="cards">
        {collection.items.map((item) => <article key={item.taskId} className="my-work-card">
          <h3 className="m-0">{item.title}</h3>
          <dl className="m-0 grid gap-moviqo-2">
            <ReportCardValue label={t("myWork.myTasks.workflowColumn")} value={item.workflowName} />
            <ReportCardValue label={t("myWork.myTasks.processColumn")} value={toProcessReference(item.processId)} />
            <ReportCardValue label={t("myWork.myTasks.statusColumn")} value={statusLabelFor(item.status, t)} />
            <ReportCardValue label={t("myWork.myTasks.assignedColumn")} value={formatDateTimeInTimeZone(item.activatedAt, timeZone)} />
          </dl>
          <ButtonLink
            aria-label={`${t("myWork.myTasks.open")}: ${item.title}`}
            href={item.openTaskRoute}
            variant="secondary"
            width="full"
            onClick={(event) => onNavigate?.(item.openTaskRoute, event)}
          >{t("myWork.myTasks.open")}</ButtonLink>
        </article>)}
      </div>
    </>}
    {renderCollectionPagination(
      collection,
      onPageChange,
      t,
      query.myTasksPage,
      t("myWork.myTasks.title"),
      isRefreshing
    )}
  </div>;
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
  isRefreshing = false,
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void
) => {
  if (startingWorkflowId !== null) {
    return <LoadingState>{t("myWork.startWorkflows.starting")}</LoadingState>;
  }

  const content = renderRegionState<MyWorkStartWorkflow>(
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
      <div className="button-row">
        <Button
          disabled={isRefreshing}
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
    (collection) => renderCollectionPagination(
      collection,
      onPageChange,
      t,
      page,
      t("myWork.startWorkflows.title"),
      isRefreshing
    )
  );
  return <div className="grid gap-moviqo-4" aria-busy={isRefreshing || undefined}>
    {isRefreshing ? <p className="m-0 text-sm font-semibold text-moviqo-primary" role="status">
      {t("myWork.refreshing")}
    </p> : null}
    {content}
  </div>;
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
  isRefreshing: boolean,
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
  return <div className="grid gap-moviqo-4" aria-busy={isRefreshing || undefined}>
    {controls}
    {isRefreshing ? <p className="m-0 text-sm font-semibold text-moviqo-primary" role="status">
      {t("myWork.refreshing")}
    </p> : null}
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
                <th className={reportHeadingClasses} scope="col">{t("myWork.myProcesses.workflowColumn")}</th>
                <th className={reportHeadingClasses} scope="col">{t("myWork.myProcesses.referenceColumn")}</th>
                <th className={reportHeadingClasses} scope="col">{t("myWork.myProcesses.statusColumn")}</th>
                <th className={reportHeadingClasses} scope="col">{t("myWork.myProcesses.stepColumn")}</th>
                <th className={reportHeadingClasses} scope="col">{t("myWork.myProcesses.involvementColumn")}</th>
                <th className={reportHeadingClasses} scope="col">{t("myWork.myProcesses.lastActivityColumn")}</th>
                <th className={reportHeadingClasses} scope="col">{t("myWork.myProcesses.actionsColumn")}</th>
              </tr>
            </thead>
            <tbody>
              {collection.items.map((item) => <tr key={item.processId}>
                <th className={`${reportCellClasses} font-semibold`} scope="row">{item.workflowName}</th>
                <td className={reportCellClasses}>{item.processNumber}</td>
                <td className={reportCellClasses}>{statusLabelFor(item.systemStatus, t)}</td>
                <td className={reportCellClasses}>
                  {processPositionLabelFor(item.currentStep, item.currentStepKind, t)}
                </td>
                <td className={reportCellClasses}>
                  <span>{processInvolvementLabelFor(item.involvement, t)}</span>
                  <small className="mt-moviqo-1 block text-moviqo-ink-secondary">
                    {processContributionLabelFor(item.contributionSummary, t)}
                  </small>
                </td>
                <td className={reportCellClasses}>{formatDateTimeInTimeZone(item.lastActivityAt, timeZone)}</td>
                <td className={reportCellClasses}>
                  <ButtonLink
                    aria-label={`${t("myWork.myProcesses.view")}: ${item.workflowName} ${item.processNumber}`}
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
          <h3 className="m-0">{item.workflowName}</h3>
          <dl className="m-0 grid gap-moviqo-2">
            <ReportCardValue label={t("myWork.myProcesses.referenceColumn")} value={item.processNumber} />
            <ReportCardValue label={t("myWork.myProcesses.statusColumn")} value={statusLabelFor(item.systemStatus, t)} />
            <ReportCardValue label={t("myWork.myProcesses.stepColumn")} value={processPositionLabelFor(item.currentStep, item.currentStepKind, t)} />
            <ReportCardValue label={t("myWork.myProcesses.involvementColumn")} value={processInvolvementLabelFor(item.involvement, t)} />
            <ReportCardValue label={t("myWork.myProcesses.lastActivityColumn")} value={formatDateTimeInTimeZone(item.lastActivityAt, timeZone)} />
          </dl>
          <p className="m-0 text-moviqo-ink-secondary">{processContributionLabelFor(item.contributionSummary, t)}</p>
            <ButtonLink
              aria-label={`${t("myWork.myProcesses.view")}: ${item.workflowName} ${item.processNumber}`}
              href={item.viewRoute}
              variant="secondary"
              width="full"
              onClick={(event) => onNavigate?.(item.viewRoute, event)}
            >
              {t("myWork.myProcesses.view")}
            </ButtonLink>
        </article>)}
        </div>
      </>
    )}
    {renderCollectionPagination(
      collection,
      onPageChange,
      t,
      query.page,
      t("myWork.myProcesses.title"),
      isRefreshing
    )}
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
  collection: MyWorkCollection<unknown>,
  onPageChange: (page: number) => void,
  t: Translate,
  requestedPage: number,
  regionLabel: string,
  isRefreshing: boolean
) => {
  const safeRequestedPage = Number.isInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const page = Number.isInteger(collection.page) && collection.page > 0
    ? collection.page
    : safeRequestedPage;
  const reportedTotalPages = Number.isInteger(collection.totalPages) && collection.totalPages >= page
    ? collection.totalPages
    : null;
  const calculatedTotalPages = Number.isInteger(collection.totalItems)
    && collection.totalItems >= 0
    && Number.isInteger(collection.limit)
    && collection.limit > 0
    ? Math.max(1, Math.ceil(collection.totalItems / collection.limit))
    : null;
  const totalPages = reportedTotalPages
    ?? (calculatedTotalPages !== null && calculatedTotalPages >= page ? calculatedTotalPages : null)
    ?? (collection.hasMore ? null : page);
  const paginationLabel = totalPages === null
    ? `${t("myWork.pagination.page")} ${page}`
    : `${t("myWork.pagination.page")} ${page} ${t("myWork.pagination.of")} ${totalPages}`;
  return <nav
    className="flex flex-wrap items-center justify-between gap-moviqo-3"
    aria-label={`${regionLabel}: ${paginationLabel}`}
  >
  <Button
    variant="secondary"
    disabled={isRefreshing || page <= 1}
    onClick={() => onPageChange(page - 1)}
  >
    {t("myWork.pagination.previousPage")}
  </Button>
  <span className="text-sm font-semibold text-moviqo-ink-secondary">
    {paginationLabel}
  </span>
  <Button
    variant="secondary"
    disabled={isRefreshing || !collection.hasMore}
    onClick={() => onPageChange(page + 1)}
  >
    {t("myWork.pagination.nextPage")}
  </Button>
</nav>;
};
