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

export type WorkflowTaskFormControl = {
  id: string;
  taskElementId: string;
  fieldId: string;
  position: number;
  width: "full";
  label: string | null;
};

export type WorkflowPublicationSection = {
  isConfigured: boolean;
};

export type WorkflowPublicationConfiguration = {
  starter: WorkflowPublicationSection;
  assignment: WorkflowPublicationSection;
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
  formBindings: WorkflowTaskFormControl[];
  publication?: WorkflowPublicationConfiguration;
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

export type WorkflowPublicationIssueSeverity = "blocking" | "warning";

export type WorkflowPublicationIssue = {
  code: string;
  severity: WorkflowPublicationIssueSeverity;
  target: string;
  elementId: string | null;
  fieldId: string | null;
  bindingId: string | null;
  message: string;
  actionLabel: string;
};

export type WorkflowPublicationValidationAccepted = {
  workflowId: string;
  revision: string;
  publishable: boolean;
  issues: WorkflowPublicationIssue[];
};
