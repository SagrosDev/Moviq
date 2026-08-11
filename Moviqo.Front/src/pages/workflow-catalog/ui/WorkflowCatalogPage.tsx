import { useNavigate } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  canCreateWorkflow,
  workflowDesignPath,
  useWorkflowCatalogQuery
} from "../../../features/workflow-design";
import { useLanguage } from "../../../shared/localization";
import { Alert, Button, Card, PageHeader } from "../../../shared/ui";

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

  return (
    <div className="grid gap-moviqo-6">
      <PageHeader
        actions={canAuthor ? (
          <Button onClick={() => navigate("/workflows/new")}>
            {t("workflowCatalog.create")}
          </Button>
        ) : undefined}
        description={t("workflowCatalog.lede")}
        eyebrow={t("workflowCatalog.eyebrow")}
        title={t("workflowCatalog.title")}
      />
      {query.isPending ? (
        <Alert announcement="polite">{t("workflowCatalog.loading")}</Alert>
      ) : query.isError ? (
        <Alert announcement="assertive" title={t("workflowCatalog.error")} tone="error">
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {t("workflowCatalog.retry")}
          </Button>
        </Alert>
      ) : query.data.items.length === 0 ? (
        <Alert announcement="polite">{t("workflowCatalog.empty")}</Alert>
      ) : (
        <div className="grid gap-moviqo-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {query.data.items.map((workflow) => (
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
