export type WorkflowElementType = "start" | "task" | "end";
export type WorkflowConnectionType = "sequence";
export type WorkflowProcessFieldKind = "shortText";
export type FormItemWidth = "full" | "half" | "third" | "quarter";
export type StructuralFormItemKind = "section" | "heading" | "instruction" | "divider";

export type WorkflowAssignmentMode =
  | "unconfigured"
  | "workflowInitiator"
  | "specificMember";

export type WorkflowAssignmentConfiguration = {
  mode: WorkflowAssignmentMode;
  membershipId: string | null;
};

export type WorkflowDraftElement = {
  id: string;
  type: WorkflowElementType;
  label: string;
  assignment?: WorkflowAssignmentConfiguration;
};

export type WorkflowDraftConnection = {
  id: string;
  type: WorkflowConnectionType;
  sourceId: string;
  targetId: string;
  label?: string | null;
};

export type WorkflowLayoutPosition = {
  x: number;
  y: number;
};

export type WorkflowDraftLayout = {
  positions: Record<string, WorkflowLayoutPosition>;
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

type WorkflowTaskFormItemBase = {
  id: string;
  taskElementId: string;
  position: number;
  width: FormItemWidth;
};

export type WorkflowTaskFieldBinding = WorkflowTaskFormItemBase & {
  kind: "field";
  fieldId: string;
  label: string | null;
};

export type WorkflowTaskContentItem = WorkflowTaskFormItemBase & {
  kind: Exclude<StructuralFormItemKind, "divider">;
  content: string;
};

export type WorkflowTaskDividerItem = WorkflowTaskFormItemBase & {
  kind: "divider";
};

export type WorkflowTaskStructuralItem = WorkflowTaskContentItem | WorkflowTaskDividerItem;
export type WorkflowTaskFormItem = WorkflowTaskFieldBinding | WorkflowTaskStructuralItem;

export type WorkflowStarterMode =
  | "unconfigured"
  | "allActiveMembers"
  | "selectedTeams"
  | "selectedMembers";

export type WorkflowStarterConfiguration = {
  mode: WorkflowStarterMode;
  teamIds: string[];
  membershipIds: string[];
};

export type WorkflowPublicationConfiguration = {
  starter: WorkflowStarterConfiguration;
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
  formBindings: WorkflowTaskFormItem[];
  publication?: WorkflowPublicationConfiguration;
  layout: WorkflowDraftLayout;
};

export const isFieldFormItem = (
  item: WorkflowTaskFormItem
): item is WorkflowTaskFieldBinding => item.kind === "field";
