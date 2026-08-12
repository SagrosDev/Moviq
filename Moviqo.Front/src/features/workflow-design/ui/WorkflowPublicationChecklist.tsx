import { useLanguage } from "../../../shared/localization";
import { Alert, Badge, Button, Card } from "../../../shared/ui";
import type { WorkflowPublicationIssue } from "../model/types";

type WorkflowPublicationChecklistProps = {
  error: boolean;
  issues: WorkflowPublicationIssue[];
  validated: boolean;
  onIssue: (issue: WorkflowPublicationIssue) => void;
};

const issueMessageKey = (issue: WorkflowPublicationIssue) => {
  const keys: Partial<Record<WorkflowPublicationIssue["code"], Parameters<ReturnType<typeof useLanguage>["t"]>[0]>> = {
    starter_missing: "workflowDesign.editor.issue.starterMissing",
    starter_invalid: "workflowDesign.editor.issue.starterInvalid",
    assignment_missing: "workflowDesign.editor.issue.assignmentMissing",
    assignment_invalid: "workflowDesign.editor.issue.assignmentInvalid",
    start_step_invalid: "workflowDesign.editor.issue.startStepInvalid",
    first_task_missing: "workflowDesign.editor.issue.firstTaskMissing",
    end_step_invalid: "workflowDesign.editor.issue.endStepInvalid",
    start_path_incomplete: "workflowDesign.editor.issue.startPathIncomplete",
    path_disconnected: "workflowDesign.editor.issue.pathDisconnected",
    path_to_end_missing: "workflowDesign.editor.issue.pathToEndMissing",
    first_task_form_missing: "workflowDesign.editor.issue.firstTaskFormMissing",
    first_task_binding_missing_field: "workflowDesign.editor.issue.firstTaskBindingMissingField",
    first_task_form_decorative: "workflowDesign.editor.issue.firstTaskFormDecorative",
    task_form_missing: "workflowDesign.editor.issue.taskFormMissing",
    task_binding_missing_field: "workflowDesign.editor.issue.taskBindingMissingField",
    task_form_decorative: "workflowDesign.editor.issue.taskFormDecorative"
  };
  return keys[issue.code];
};

const issueActionKey = (issue: WorkflowPublicationIssue) => {
  if (issue.code.startsWith("starter_")) {
    return "workflowDesign.editor.issueAction.configureStarter" as const;
  }
  if (issue.code.startsWith("assignment_")) {
    return "workflowDesign.editor.issueAction.configureAssignment" as const;
  }
  if (issue.code === "task_form_missing") {
    return "workflowDesign.editor.issueAction.openTaskForm" as const;
  }
  if (issue.code === "first_task_form_missing") {
    return "workflowDesign.editor.issueAction.openFirstTaskForm" as const;
  }
  if (issue.code.startsWith("task_binding_") || issue.code === "task_form_decorative") {
    return "workflowDesign.editor.issueAction.openTaskForm" as const;
  }
  if (issue.code.startsWith("first_task_binding_") || issue.code === "first_task_form_decorative") {
    return "workflowDesign.editor.issueAction.openReusableField" as const;
  }
  return "workflowDesign.editor.issueAction.reviewWorkflowPath" as const;
};

export const WorkflowPublicationChecklist = ({
  error,
  issues,
  validated,
  onIssue
}: WorkflowPublicationChecklistProps) => {
  const { t } = useLanguage();

  return (
    <Card labelledBy="workflow-checklist-title">
      <div className="grid gap-moviqo-1">
        <h2 className="m-0 text-moviqo-heading font-semibold" id="workflow-checklist-title" tabIndex={-1}>
          {t("workflowDesign.editor.checklistTitle")}
        </h2>
        <p className="m-0 text-sm text-moviqo-ink-secondary">
          {t("workflowDesign.editor.checklistBody")}
        </p>
      </div>
      {error ? (
        <Alert announcement="assertive" tone="error">
          {t("workflowDesign.editor.checklistError")}
        </Alert>
      ) : null}
      {issues.length > 0 ? (
        <ul className="m-0 grid gap-moviqo-3 pl-moviqo-5">
          {issues.map((issue) => {
            const key = issueMessageKey(issue);
            return (
              <li className="grid gap-moviqo-2" key={`${issue.code}:${issue.target}`}>
                <Badge tone={issue.severity === "warning" ? "warning" : "error"}>
                  {issue.severity === "warning"
                    ? t("status.needsAttention")
                    : t("status.blocked")}
                </Badge>
                <span>{key ? t(key) : t("workflowDesign.editor.checklistError")}</span>
                <Button variant="secondary" onClick={() => onIssue(issue)}>
                  {t(issueActionKey(issue))}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 text-sm text-moviqo-ink-secondary">
          {validated
            ? t("workflowDesign.editor.checklistReady")
            : t("workflowDesign.editor.checklistEmpty")}
        </p>
      )}
    </Card>
  );
};
