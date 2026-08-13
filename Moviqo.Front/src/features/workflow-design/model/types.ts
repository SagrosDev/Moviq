import type {
  WorkflowAssignmentConfiguration,
  WorkflowAssignmentMode,
  WorkflowConnectionType,
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement,
  WorkflowElementType,
  WorkflowProcessField,
  WorkflowProcessFieldKind,
  WorkflowStarterMode,
  WorkflowTaskFormItem
} from "../../../entities/workflow";

export type {
  WorkflowAssignmentConfiguration,
  WorkflowAssignmentMode,
  WorkflowConnectionType,
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement,
  WorkflowElementType,
  WorkflowProcessField,
  WorkflowProcessFieldKind,
  WorkflowStarterMode,
  WorkflowTaskFormItem
};

export type WorkflowTaskFormControl = WorkflowTaskFormItem;

export type WorkflowStarterConfiguration = {
  mode: WorkflowStarterMode;
  teamIds: string[];
  membershipIds: string[];
};

export type WorkflowPublicationConfiguration = {
  starter: WorkflowStarterConfiguration;
};

export type WorkflowConfigurationDirectoryMembership = {
  membershipId: string;
  displayName: string;
  email: string;
  role: string;
};

export type WorkflowConfigurationDirectoryTeam = {
  teamId: string;
  name: string;
  activeMemberCount: number;
  membershipIds: string[];
};

export type WorkflowConfigurationDirectory = {
  memberships: WorkflowConfigurationDirectoryMembership[];
  teams: WorkflowConfigurationDirectoryTeam[];
};

export type WorkflowCreationAccepted = {
  workflowId: string;
  organizationId: string;
  createdByMembershipId: string;
  configurationDirectory: WorkflowConfigurationDirectory;
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

export type WorkflowPublishedVersion = {
  versionNumber: number;
  publishedAt: string;
  sourceRevision: string;
  schemaVersion: number;
};

export type WorkflowPublishAccepted = WorkflowCreationAccepted & {
  publishedVersion: WorkflowPublishedVersion;
};
