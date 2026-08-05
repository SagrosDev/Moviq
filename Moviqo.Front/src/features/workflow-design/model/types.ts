export type WorkflowElementType = "start" | "task" | "end";

export type WorkflowConnectionType = "sequence";
export type WorkflowProcessFieldKind = "shortText";

export type WorkflowDraftElement = {
  id: string;
  type: WorkflowElementType;
  label: string;
};

export type WorkflowDraftConnection = {
  id: string;
  type: WorkflowConnectionType;
  sourceId: string;
  targetId: string;
};

export type WorkflowProcessField = {
  id: string;
  kind: WorkflowProcessFieldKind;
  label: string;
  helpText: string;
  placeholder: string;
  defaultValue: string | null;
  minimumLength: number;
  maximumLength: number;
};

export type WorkflowFormBinding = {
  id: string;
  taskElementId: string;
  fieldId: string;
};

export type WorkflowDraftDocument = {
  schemaVersion: number;
  draftId: string;
  workflowId: string;
  name: string;
  status: string;
  elements: WorkflowDraftElement[];
  connections: WorkflowDraftConnection[];
  processFields: WorkflowProcessField[];
  formBindings: WorkflowFormBinding[];
};

export type WorkflowCreationAccepted = {
  workflowId: string;
  organizationId: string;
  createdByMembershipId: string;
  name: string;
  revision: string;
  draft: WorkflowDraftDocument;
};

export type WorkflowCreationFormState = {
  name: string;
  status: "editing" | "submitting" | "error" | "success";
  errorCode: string | null;
};

export type WorkflowDraftSaveAccepted = WorkflowCreationAccepted;
