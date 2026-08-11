import type { WorkflowDraftDocument, WorkflowDraftElement } from "./types";

const pathIdentity = (identity: string) => encodeURIComponent(identity);

export const workflowDesignPath = (workflowId: string) =>
  `/workflows/${pathIdentity(workflowId)}/design`;

export const formDesignPath = (workflowId: string, taskElementId: string) =>
  `/workflows/${pathIdentity(workflowId)}/tasks/${pathIdentity(taskElementId)}/form`;

export const workflowTaskElements = (
  draft: WorkflowDraftDocument
): WorkflowDraftElement[] => draft.elements.filter((element) => element.type === "task");

export const resolveTaskElement = (
  draft: WorkflowDraftDocument,
  taskElementId: string
): WorkflowDraftElement | null => draft.elements.find(
  (element) => element.id === taskElementId && element.type === "task"
) ?? null;
