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
  WorkflowAssignmentMode,
  WorkflowConfigurationDirectory,
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement,
  WorkflowPublicationIssue,
  WorkflowPublicationValidationAccepted,
  WorkflowProcessField,
  WorkflowDraftSaveAccepted,
  WorkflowStarterMode,
  WorkflowElementType
} from "./types";

const workflowDesignClient = createApiClient({ baseUrl: "/api/v1" });
export const MAX_AUTOSAVE_RETRIES = 3;

export type WorkflowDraftEditorState = {
  localDraft: WorkflowDraftDocument;
  hasLocalChanges: boolean;
  saveStatus: "idle" | "unsaved" | "saving" | "retrying" | "saved" | "conflict" | "error";
  errorCode: string | null;
  errorMessages: string[];
  invalidFieldNames: string[];
  lastAcknowledgedRevision: DraftRevision;
  pendingAutosaveRequestKey: string | null;
  conflictSnapshot: WorkflowDraftDocument | null;
  retryCount: number;
  publicationStatus: "idle" | "validating" | "error" | "success";
  publicationErrorCode: string | null;
  publicationIssues: WorkflowPublicationIssue[];
  activePublicationRequestKey: string | null;
  focusedChecklistSection: "starter" | "assignment" | "canvas" | "field" | null;
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
  lastAcknowledgedRevision: draftState.revision,
  pendingAutosaveRequestKey: null,
  conflictSnapshot: null,
  retryCount: 0,
  saveStatus: "idle",
  errorCode: null,
  errorMessages: [],
  invalidFieldNames: [],
  publicationStatus: "idle",
  publicationErrorCode: null,
  publicationIssues: [],
  activePublicationRequestKey: null,
  focusedChecklistSection: null
});

const clearPublicationState = (
  state: Omit<
    WorkflowDraftEditorState,
    | "publicationStatus"
    | "publicationErrorCode"
    | "publicationIssues"
    | "activePublicationRequestKey"
  >
): WorkflowDraftEditorState => ({
  ...state,
  publicationStatus: "idle",
  publicationErrorCode: null,
  publicationIssues: [],
  activePublicationRequestKey: null
});

export const syncWorkflowDraftEditorState = (
  state: WorkflowDraftEditorState,
  draftState: DraftState<WorkflowDraftDocument>,
  force = false
): WorkflowDraftEditorState =>
  state.hasLocalChanges && !force
      ? {
        ...state,
        saveStatus:
          state.saveStatus === "saving" || state.saveStatus === "saved"
            ? "unsaved"
            : state.saveStatus
      }
    : clearPublicationState({
        localDraft: structuredClone(draftState.value),
        hasLocalChanges: false,
        lastAcknowledgedRevision: draftState.revision,
        pendingAutosaveRequestKey: null,
        conflictSnapshot: null,
        retryCount: 0,
        saveStatus: force ? "saved" : "idle",
        errorCode: null,
        errorMessages: [],
        invalidFieldNames: [],
        focusedChecklistSection: state.focusedChecklistSection
      });

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

export const setStarterMode = (
  draft: WorkflowDraftDocument,
  mode: WorkflowStarterMode
): WorkflowDraftDocument => ({
  ...draft,
  publication: {
    starter: {
      mode,
      teamIds: isScopedStarterMode(mode) ? draft.publication?.starter.teamIds ?? [] : [],
      membershipIds: isScopedStarterMode(mode)
        ? draft.publication?.starter.membershipIds ?? []
        : []
    },
    assignment: draft.publication?.assignment ?? {
      mode: "unconfigured",
      membershipId: null
    }
  }
});

export const toggleStarterTeam = (
  draft: WorkflowDraftDocument,
  teamId: string
): WorkflowDraftDocument => {
  const teamIds = new Set(draft.publication?.starter.teamIds ?? []);
  if (teamIds.has(teamId)) {
    teamIds.delete(teamId);
  } else {
    teamIds.add(teamId);
  }
  return {
    ...draft,
    publication: {
      starter: {
        mode: isScopedStarterMode(draft.publication?.starter.mode)
          ? draft.publication!.starter.mode
          : "selectedTeams",
        teamIds: Array.from(teamIds),
        membershipIds: draft.publication?.starter.membershipIds ?? []
      },
      assignment: draft.publication?.assignment ?? {
        mode: "unconfigured",
        membershipId: null
      }
    }
  };
};

export const toggleStarterMembership = (
  draft: WorkflowDraftDocument,
  membershipId: string
): WorkflowDraftDocument => {
  const membershipIds = new Set(draft.publication?.starter.membershipIds ?? []);
  if (membershipIds.has(membershipId)) {
    membershipIds.delete(membershipId);
  } else {
    membershipIds.add(membershipId);
  }
  return {
    ...draft,
    publication: {
      starter: {
        mode: isScopedStarterMode(draft.publication?.starter.mode)
          ? draft.publication!.starter.mode
          : "selectedMembers",
        teamIds: draft.publication?.starter.teamIds ?? [],
        membershipIds: Array.from(membershipIds)
      },
      assignment: draft.publication?.assignment ?? {
        mode: "unconfigured",
        membershipId: null
      }
    }
  };
};

export const setAssignmentMode = (
  draft: WorkflowDraftDocument,
  mode: WorkflowAssignmentMode
): WorkflowDraftDocument => ({
  ...draft,
  publication: {
    starter: draft.publication?.starter ?? {
      mode: "unconfigured",
      teamIds: [],
      membershipIds: []
    },
    assignment: {
      mode,
      membershipId:
        mode === "specificMember" ? draft.publication?.assignment.membershipId ?? null : null
    }
  }
});

export const setAssignmentMembership = (
  draft: WorkflowDraftDocument,
  membershipId: string
): WorkflowDraftDocument => ({
  ...draft,
  publication: {
    starter: draft.publication?.starter ?? {
      mode: "unconfigured",
      teamIds: [],
      membershipIds: []
    },
    assignment: {
      mode: "specificMember",
      membershipId
    }
  }
});

export const reduceWorkflowDraftEditorState = (
  state: WorkflowDraftEditorState,
  action:
    | { type: "start-added"; labels: WorkflowElementLabels }
    | { type: "task-added"; labels: WorkflowElementLabels }
    | { type: "end-added"; labels: WorkflowElementLabels }
    | { type: "connected"; sourceId: string; targetId: string }
    | { type: "short-text-configured"; field: ShortTextFieldDraft }
    | { type: "first-task-binding-toggled"; enabled: boolean }
    | { type: "starter-mode-selected"; mode: WorkflowStarterMode }
    | { type: "starter-team-toggled"; teamId: string }
    | { type: "starter-membership-toggled"; membershipId: string }
    | { type: "assignment-mode-selected"; mode: WorkflowAssignmentMode }
    | { type: "assignment-membership-selected"; membershipId: string }
    | { type: "save-requested"; requestKey: string; retry: boolean }
    | {
        type: "save-failed";
        errorCode: string;
        errorMessages: string[];
        invalidFieldNames: string[];
        retryable: boolean;
        conflict: boolean;
      }
    | { type: "publication-validation-requested"; requestKey: string }
    | {
        type: "publication-validation-failed";
        requestKey: string;
        errorCode: string;
        errorMessage: string;
      }
    | {
        type: "publication-validation-succeeded";
        requestKey: string;
        validation: WorkflowPublicationValidationAccepted;
      }
    | { type: "reload-latest-succeeded"; draftState: DraftState<WorkflowDraftDocument> }
    | { type: "reapply-conflict-draft" }
    | { type: "checklist-target-selected"; target: string }
    | { type: "save-succeeded"; draftState: DraftState<WorkflowDraftDocument> }
    | { type: "server-synced"; draftState: DraftState<WorkflowDraftDocument> }
): WorkflowDraftEditorState => {
  const markDirty = (draft: WorkflowDraftDocument) =>
    clearPublicationState({
      ...state,
      localDraft: draft,
      hasLocalChanges: true,
      pendingAutosaveRequestKey:
        state.hasLocalChanges && state.saveStatus === "unsaved"
          ? state.pendingAutosaveRequestKey ?? createSaveIdempotencyKey(draft.workflowId)
          : createSaveIdempotencyKey(draft.workflowId),
      conflictSnapshot: state.saveStatus === "conflict" ? state.conflictSnapshot : null,
      retryCount: 0,
      saveStatus: "unsaved",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    });

  if (action.type === "start-added") {
    return markDirty(addGuidedWorkflowElement(state.localDraft, "start", action.labels));
  }

  if (action.type === "task-added") {
    return markDirty(addGuidedWorkflowElement(state.localDraft, "task", action.labels));
  }

  if (action.type === "end-added") {
    return markDirty(addGuidedWorkflowElement(state.localDraft, "end", action.labels));
  }

  if (action.type === "connected") {
    return markDirty(
      connectWorkflowElements(state.localDraft, action.sourceId, action.targetId)
    );
  }

  if (action.type === "short-text-configured") {
    return markDirty(upsertShortTextProcessField(state.localDraft, action.field));
  }

  if (action.type === "first-task-binding-toggled") {
    return markDirty(setFirstTaskFieldBinding(state.localDraft, action.enabled));
  }

  if (action.type === "starter-mode-selected") {
    return markDirty(setStarterMode(state.localDraft, action.mode));
  }

  if (action.type === "starter-team-toggled") {
    return markDirty(toggleStarterTeam(state.localDraft, action.teamId));
  }

  if (action.type === "starter-membership-toggled") {
    return markDirty(toggleStarterMembership(state.localDraft, action.membershipId));
  }

  if (action.type === "assignment-mode-selected") {
    return markDirty(setAssignmentMode(state.localDraft, action.mode));
  }

  if (action.type === "assignment-membership-selected") {
    return markDirty(setAssignmentMembership(state.localDraft, action.membershipId));
  }

  if (action.type === "save-requested") {
    return {
      ...state,
      saveStatus: action.retry ? "retrying" : "saving",
      pendingAutosaveRequestKey: action.requestKey,
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "save-failed") {
    const nextRetryCount = action.retryable ? state.retryCount + 1 : 0;
    const exhaustedRetries = nextRetryCount > MAX_AUTOSAVE_RETRIES;
    const nextStatus = action.conflict
      ? "conflict"
      : action.retryable && !exhaustedRetries
        ? "retrying"
        : "error";
    return {
      ...state,
      hasLocalChanges: true,
      pendingAutosaveRequestKey:
        action.errorCode === "idempotency_key_reused"
          ? createSaveIdempotencyKey(state.localDraft.workflowId)
          : state.pendingAutosaveRequestKey,
      conflictSnapshot: action.conflict ? structuredClone(state.localDraft) : state.conflictSnapshot,
      retryCount: action.conflict ? 0 : nextRetryCount,
      saveStatus: nextStatus,
      errorCode: action.errorCode,
      errorMessages: action.errorMessages,
      invalidFieldNames: action.invalidFieldNames
    };
  }

  if (action.type === "publication-validation-requested") {
    return {
      ...state,
      publicationStatus: "validating",
      publicationErrorCode: null,
      activePublicationRequestKey: action.requestKey
    };
  }

  if (action.type === "publication-validation-failed") {
    if (state.activePublicationRequestKey !== action.requestKey) {
      return state;
    }
    return {
      ...state,
      publicationStatus: "error",
      publicationErrorCode: action.errorCode,
      publicationIssues: [],
      activePublicationRequestKey: null
    };
  }

  if (action.type === "publication-validation-succeeded") {
    if (state.activePublicationRequestKey !== action.requestKey) {
      return state;
    }
    return {
      ...state,
      publicationStatus: "success",
      publicationErrorCode: null,
      publicationIssues: action.validation.issues,
      activePublicationRequestKey: null
    };
  }

  if (action.type === "checklist-target-selected") {
    return {
      ...state,
      focusedChecklistSection: focusChecklistTarget(action.target)
    };
  }

  if (action.type === "reload-latest-succeeded") {
    return clearPublicationState({
      ...state,
      localDraft: structuredClone(action.draftState.value),
      hasLocalChanges: false,
      lastAcknowledgedRevision: action.draftState.revision,
      pendingAutosaveRequestKey: null,
      retryCount: 0,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: [],
      focusedChecklistSection: state.focusedChecklistSection
    });
  }

  if (action.type === "reapply-conflict-draft") {
    if (!state.conflictSnapshot) {
      return state;
    }
    return clearPublicationState({
      ...state,
      localDraft: structuredClone(state.conflictSnapshot),
      hasLocalChanges: true,
      pendingAutosaveRequestKey: createSaveIdempotencyKey(state.conflictSnapshot.workflowId),
      retryCount: 0,
      saveStatus: "unsaved",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: [],
      focusedChecklistSection: state.focusedChecklistSection
    });
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
  expectedRevision: DraftRevision,
  localDraft: WorkflowDraftDocument,
  requestKey: string
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
      expectedRevision,
      draft: localDraft
    },
    headers: { "Idempotency-Key": requestKey }
  });

  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as WorkflowDraftSaveAccepted
  };
};

export const validateWorkflowPublication = async (
  draftState: DraftState<WorkflowDraftDocument>,
  localDraft: WorkflowDraftDocument,
  requestKey: string
): Promise<
  | { ok: true; data: WorkflowPublicationValidationAccepted }
  | { ok: false; error: NormalizedApiProblem }
> => {
  const response = await (
    workflowDesignClient as {
      POST(
        path: string,
        init?: object
      ): Promise<{ data?: unknown; response: Response }>;
    }
  ).POST(
    `/api/v1/workflow-design/workflows/${localDraft.workflowId}/publication-validation/`,
    {
      body: {
        expectedRevision: draftState.revision,
        draft: localDraft
      },
      headers: {
        "Idempotency-Key": requestKey
      }
    }
  );

  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as WorkflowPublicationValidationAccepted
  };
};

export const readWorkflowDraft = async (
  workflowId: string
): Promise<
  | { ok: true; data: WorkflowDraftSaveAccepted }
  | { ok: false; error: NormalizedApiProblem }
> => {
  const response = await (
    workflowDesignClient as {
      GET(path: string, init?: object): Promise<{ data?: unknown; response: Response }>;
    }
  ).GET(`/api/v1/workflow-design/workflows/${workflowId}/draft/`);

  if (!response.response.ok) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return {
    ok: true,
    data: response.data as WorkflowDraftSaveAccepted
  };
};

export const shouldScheduleAutosave = (state: WorkflowDraftEditorState) =>
  state.hasLocalChanges &&
  state.pendingAutosaveRequestKey !== null &&
  (state.saveStatus === "unsaved" || state.saveStatus === "retrying");

export const autosaveDelayMs = (state: WorkflowDraftEditorState) => {
  if (state.saveStatus === "unsaved") {
    return 800;
  }
  if (state.saveStatus !== "retrying") {
    return null;
  }
  return 2000 * 2 ** Math.max(0, state.retryCount - 1);
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

export const focusChecklistTarget = (target: string) => {
  if (target === "configuration.starter") {
    return "starter" as const;
  }
  if (target === "configuration.assignment") {
    return "assignment" as const;
  }
  if (target.startsWith("processFields.") || target.startsWith("formBindings.")) {
    return "field" as const;
  }
  return "canvas" as const;
};

export const clearPublicationChecklist = (_issues: WorkflowPublicationIssue[]) => [];

export const createPublicationValidationRequestKey = (workflowId: string) =>
  `workflow-validate-${workflowId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

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

export const createSaveIdempotencyKey = (workflowId: string) =>
  `workflow-save-${workflowId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const summarizeStarterSelection = (
  draft: WorkflowDraftDocument,
  directory: WorkflowConfigurationDirectory
) => {
  const starter = draft.publication?.starter;
  if (!starter || starter.mode === "unconfigured") {
    return "";
  }
  if (starter.mode === "allActiveMembers") {
    return "";
  }
  const teamSummary = starter.teamIds.map(
    (teamId) => directory.teams.find((team) => team.teamId === teamId)?.name ?? teamId
  );
  const membershipSummary = starter.membershipIds.map(
    (membershipId) =>
      directory.memberships.find((membership) => membership.membershipId === membershipId)
        ?.displayName ?? membershipId
  );
  return [...teamSummary, ...membershipSummary].join(", ");
};

const isScopedStarterMode = (mode: WorkflowStarterMode | undefined): mode is "selectedTeams" | "selectedMembers" =>
  mode === "selectedTeams" || mode === "selectedMembers";
