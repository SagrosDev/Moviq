import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  WorkflowCreateForm,
  canCreateWorkflow,
  workflowDesignPath
} from "../../../features/workflow-design";
import { moviqoQueryKeys } from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import { Alert, PageHeader } from "../../../shared/ui";

export const WorkflowCreatePage = () => {
  const { t } = useLanguage();
  const { state } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (state.status !== "authenticated") {
    return <Alert announcement="polite">{t("app.loading")}</Alert>;
  }

  const canAuthor = canCreateWorkflow(state.context.membership.role);
  const organizationId = state.context.membership.organizationId;

  return (
    <div className="grid gap-moviqo-6">
      <PageHeader
        description={t("workflowDesign.create.lede")}
        eyebrow={t("workflowDesign.create.eyebrow")}
        title={t("workflowDesign.create.title")}
      />
      {!canAuthor ? (
        <Alert announcement="assertive" title={t("authority.title")} tone="error">
          {t("authority.accessDenied")}
        </Alert>
      ) : (
        <>
          <aside
            className="workflow-authoring-notice"
            role="note"
            aria-labelledby="workflow-authoring-notice-title"
          >
            <h2 id="workflow-authoring-notice-title">
              {t("workflowDesign.authoring.narrowTitle")}
            </h2>
            <p>{t("workflowDesign.authoring.narrowBody")}</p>
          </aside>
          <div className="workflow-authoring-surface">
            <WorkflowCreateForm
              onBackHref="/workflows"
              onBack={() => navigate("/workflows")}
              onCreated={(accepted) => {
                queryClient.setQueryData(
                  moviqoQueryKeys.workflowDraft(organizationId, accepted.workflowId),
                  accepted
                );
                void queryClient.invalidateQueries({
                  queryKey: moviqoQueryKeys.workflowCatalog(organizationId)
                });
                navigate(workflowDesignPath(accepted.workflowId), { replace: true });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
