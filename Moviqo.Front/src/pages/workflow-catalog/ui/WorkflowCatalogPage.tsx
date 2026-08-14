import { useNavigate } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  canCreateWorkflow,
  workflowDesignPath,
  useWorkflowCatalogQuery
} from "../../../features/workflow-design";
import { useLanguage } from "../../../shared/localization";
import { Alert, Button, Card, LoadingState, PageHeader } from "../../../shared/ui";

export const WorkflowCatalogPage = () => {
  const { t } = useLanguage();
  const { state } = useSession();
  const navigate = useNavigate();
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const query = useWorkflowCatalogQuery(organizationId);
  const canAuthor = state.status === "authenticated"
    && canCreateWorkflow(state.context.membership.role);
  const isEmpty = query.isSuccess && query.data.items.length === 0;

  return (
    <div className="grid gap-moviqo-6">
      <PageHeader
        actions={canAuthor && !query.isError && !isEmpty ? (
          <Button onClick={() => navigate("/workflows/new")}>
            {t("workflowCatalog.create")}
          </Button>
        ) : undefined}
        description={t("workflowCatalog.lede")}
        title={t("workflowCatalog.title")}
      />
      {query.isPending ? (
        <LoadingState>{t("workflowCatalog.loading")}</LoadingState>
      ) : query.isError ? (
        <Alert announcement="assertive" title={t("workflowCatalog.error")} tone="error">
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {t("workflowCatalog.retry")}
          </Button>
        </Alert>
      ) : isEmpty ? (
        <Card labelledBy="workflows-empty-title">
          <div className="grid gap-moviqo-4" role="status">
            <div className="grid gap-moviqo-2">
              <h2 className="m-0 text-moviqo-heading" id="workflows-empty-title">
                {t("workflowCatalog.emptyTitle")}
              </h2>
              <p className="m-0 text-moviqo-ink-secondary">{t("workflowCatalog.empty")}</p>
            </div>
            {canAuthor ? (
              <div>
                <Button onClick={() => navigate("/workflows/new")}>
                  {t("workflowCatalog.create")}
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="grid gap-moviqo-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {query.data?.items.map((workflow) => (
            <Card key={workflow.workflowId} labelledBy={`workflow-${workflow.workflowId}`}>
              <h2 className="m-0 text-moviqo-heading" id={`workflow-${workflow.workflowId}`}>
                {workflow.name}
              </h2>
              <p className="m-0 text-moviqo-ink-secondary">
                {`${t("workflowDesign.draft.revision")} ${workflow.revision}`}
              </p>
              <Button onClick={() => navigate(workflowDesignPath(workflow.workflowId))}>
                {t("workflowCatalog.open")}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
