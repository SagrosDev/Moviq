import {
  draftReducer,
  type DraftRevision,
  type DraftState
} from "../../../shared/drafts";
import {
  createApiClient,
  readApiProblem,
  type NormalizedApiProblem
} from "../../../shared/api";
import type {
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement,
  WorkflowProcessField,
  WorkflowDraftSaveAccepted,
  WorkflowElementType
} from "./types";

const workflowDesignClient = createApiClient({ baseUrl: "/api/v1" });

export type WorkflowDraftEditorState = {
  localDraft: WorkflowDraftDocument;
  hasLocalChanges: boolean;
  saveStatus: "idle" | "saving" | "error" | "success";
  errorCode: string | null;
  errorMessages: string[];
  invalidFieldNames: string[];
};

export type WorkflowElementLabels = {
  start: string;
  task: string;
  end: string;
};

export type ShortTextFieldDraft = {
  label: string;
  helpText: string;
  placeholder: string;
  defaultValue: string;
  minimumLength: number;
  maximumLength: number;
};

export const createWorkflowDraftEditorState = (
  draftState: DraftState<WorkflowDraftDocument>
): WorkflowDraftEditorState => ({
  localDraft: structuredClone(draftState.value),
  hasLocalChanges: false,
  saveStatus: "idle",
  errorCode: null,
  errorMessages: [],
  invalidFieldNames: []
});

export const syncWorkflowDraftEditorState = (
  state: WorkflowDraftEditorState,
  draftState: DraftState<WorkflowDraftDocument>,
  force = false
): WorkflowDraftEditorState =>
  state.hasLocalChanges && !force
    ? {
        ...state,
        saveStatus: state.saveStatus === "saving" ? "idle" : state.saveStatus
      }
    : {
        localDraft: structuredClone(draftState.value),
        hasLocalChanges: false,
        saveStatus: force ? "success" : "idle",
        errorCode: null,
        errorMessages: [],
        invalidFieldNames: []
      };

export const addGuidedWorkflowElement = (
  draft: WorkflowDraftDocument,
  type: WorkflowElementType,
  labels: WorkflowElementLabels
): WorkflowDraftDocument => {
  if (type !== "task" && draft.elements.some((element) => element.type === type)) {
    return draft;
  }
  if (type === "task" && draft.elements.some((element) => element.type === "task")) {
    return draft;
  }

  const nextElement: WorkflowDraftElement = {
    id: createElementId(draft, type),
    type,
    label: nextElementLabel(draft, type, labels)
  };

  return {
    ...draft,
    elements: [...draft.elements, nextElement]
  };
};

export const connectWorkflowElements = (
  draft: WorkflowDraftDocument,
  sourceId: string,
  targetId: string
): WorkflowDraftDocument => {
  const alreadyConnected = draft.connections.some(
    (connection) =>
      connection.sourceId === sourceId && connection.targetId === targetId
  );
  if (alreadyConnected) {
    return draft;
  }

  const nextConnection: WorkflowDraftConnection = {
    id: createConnectionId(draft),
    type: "sequence",
    sourceId,
    targetId
  };

  return {
    ...draft,
    connections: [...draft.connections, nextConnection]
  };
};

export const upsertShortTextProcessField = (
  draft: WorkflowDraftDocument,
  fieldDraft: ShortTextFieldDraft
): WorkflowDraftDocument => {
  const existingField = draft.processFields[0];
  const nextField: WorkflowProcessField = {
    id: existingField?.id ?? "field-1",
    kind: "shortText",
    label: fieldDraft.label.trim(),
    helpText: fieldDraft.helpText.trim(),
    placeholder: fieldDraft.placeholder.trim(),
    defaultValue: fieldDraft.defaultValue.trim() || null,
    minimumLength: fieldDraft.minimumLength,
    maximumLength: fieldDraft.maximumLength
  };

  return {
    ...draft,
    processFields: existingField ? [nextField] : [nextField]
  };
};

export const setFirstTaskFieldBinding = (
  draft: WorkflowDraftDocument,
  enabled: boolean
): WorkflowDraftDocument => {
  const firstTask = draft.elements.find((element) => element.type === "task");
  const firstField = draft.processFields[0];
  if (!firstTask || !firstField) {
    return draft;
  }

  if (!enabled) {
    return {
      ...draft,
      formBindings: draft.formBindings.filter(
        (binding) =>
          !(
            binding.taskElementId === firstTask.id && binding.fieldId === firstField.id
          )
      )
    };
  }

  const existingBinding = draft.formBindings.find(
    (binding) =>
      binding.taskElementId === firstTask.id && binding.fieldId === firstField.id
  );
  if (existingBinding) {
    return draft;
  }

  return {
    ...draft,
    formBindings: [
      ...draft.formBindings,
      {
        id: `binding-${draft.formBindings.length + 1}`,
        taskElementId: firstTask.id,
        fieldId: firstField.id,
        position: 0,
        width: "full",
        label: null
      }
    ]
  };
};

export const reduceWorkflowDraftEditorState = (
  state: WorkflowDraftEditorState,
  action:
    | { type: "start-added"; labels: WorkflowElementLabels }
    | { type: "task-added"; labels: WorkflowElementLabels }
    | { type: "end-added"; labels: WorkflowElementLabels }
    | { type: "connected"; sourceId: string; targetId: string }
    | { type: "short-text-configured"; field: ShortTextFieldDraft }
    | { type: "first-task-binding-toggled"; enabled: boolean }
    | { type: "save-requested" }
    | {
        type: "save-failed";
        errorCode: string;
        errorMessages: string[];
        invalidFieldNames: string[];
      }
    | { type: "save-succeeded"; draftState: DraftState<WorkflowDraftDocument> }
    | { type: "server-synced"; draftState: DraftState<WorkflowDraftDocument> }
): WorkflowDraftEditorState => {
  if (action.type === "start-added") {
    return {
      ...state,
      localDraft: addGuidedWorkflowElement(state.localDraft, "start", action.labels),
      hasLocalChanges: true,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "task-added") {
    return {
      ...state,
      localDraft: addGuidedWorkflowElement(state.localDraft, "task", action.labels),
      hasLocalChanges: true,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "end-added") {
    return {
      ...state,
      localDraft: addGuidedWorkflowElement(state.localDraft, "end", action.labels),
      hasLocalChanges: true,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "connected") {
    return {
      ...state,
      localDraft: connectWorkflowElements(
        state.localDraft,
        action.sourceId,
        action.targetId
      ),
      hasLocalChanges: true,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "short-text-configured") {
    return {
      ...state,
      localDraft: upsertShortTextProcessField(state.localDraft, action.field),
      hasLocalChanges: true,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "first-task-binding-toggled") {
    return {
      ...state,
      localDraft: setFirstTaskFieldBinding(state.localDraft, action.enabled),
      hasLocalChanges: true,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "save-requested") {
    return {
      ...state,
      saveStatus: "saving",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "save-failed") {
    return {
      ...state,
      hasLocalChanges: true,
      saveStatus: "error",
      errorCode: action.errorCode,
      errorMessages: action.errorMessages,
      invalidFieldNames: action.invalidFieldNames
    };
  }

  if (action.type === "save-succeeded" || action.type === "server-synced") {
    return syncWorkflowDraftEditorState(
      state,
      action.draftState,
      action.type === "save-succeeded"
    );
  }

  return state;
};

export const applyWorkflowDraftSave = (
  state: DraftState<WorkflowDraftDocument>,
  accepted: WorkflowDraftSaveAccepted,
  expectedRevision: DraftRevision
) =>
  draftReducer(state, {
    type: "server-accepted-update",
    value: accepted.draft,
    expectedRevision,
    nextRevision: accepted.revision as DraftRevision
  });

export const saveWorkflowDraft = async (
  draftState: DraftState<WorkflowDraftDocument>,
  localDraft: WorkflowDraftDocument
): Promise<
  | { ok: true; data: WorkflowDraftSaveAccepted }
  | { ok: false; error: NormalizedApiProblem }
> => {
  const response = await (
    workflowDesignClient as {
      PUT(
        path: string,
        init?: object
      ): Promise<{ data?: unknown; response: Response }>;
    }
  ).PUT(`/api/v1/workflow-design/workflows/${localDraft.workflowId}/draft/`, {
    body: {
      expectedRevision: draftState.revision,
      draft: localDraft
    },
    headers: { "Idempotency-Key": createSaveIdempotencyKey(localDraft.workflowId) }
  });

  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as WorkflowDraftSaveAccepted
  };
};

export const workflowPathPreview = (
  draft: WorkflowDraftDocument
): Array<WorkflowDraftElement | WorkflowDraftConnection> => {
  const orderedItems: Array<WorkflowDraftElement | WorkflowDraftConnection> = [];
  const start = draft.elements.find((element) => element.type === "start");
  if (!start) {
    return draft.elements;
  }

  const pushPath = (elementId: string) => {
    const element = draft.elements.find((candidate) => candidate.id === elementId);
    if (!element) {
      return;
    }
    orderedItems.push(element);
    const nextConnection = draft.connections.find(
      (connection) => connection.sourceId === elementId
    );
    if (!nextConnection) {
      return;
    }
    orderedItems.push(nextConnection);
    pushPath(nextConnection.targetId);
  };

  pushPath(start.id);
  return orderedItems.length > 0 ? orderedItems : draft.elements;
};

const createElementId = (
  draft: WorkflowDraftDocument,
  type: WorkflowElementType
) => {
  const nextOrdinal =
    draft.elements.filter((element) => element.type === type).length + 1;
  return `${type}-${nextOrdinal}`;
};

const createConnectionId = (draft: WorkflowDraftDocument) =>
  `connection-${draft.connections.length + 1}`;

const nextElementLabel = (
  draft: WorkflowDraftDocument,
  type: WorkflowElementType,
  labels: WorkflowElementLabels
) => {
  if (type === "start") {
    return labels.start;
  }
  if (type === "end") {
    return labels.end;
  }
  const taskCount = draft.elements.filter((element) => element.type === "task").length;
  return taskCount === 0 ? labels.task : `${labels.task} ${taskCount + 1}`;
};

const createSaveIdempotencyKey = (workflowId: string) =>
  `workflow-save-${workflowId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
