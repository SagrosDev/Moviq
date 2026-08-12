import {
  draftReducer,
  type DraftRevision,
  type DraftState
} from "../../../shared/drafts";
import {
  createApiClient,
  normalizeApiProblem,
  readApiProblem,
  type NormalizedApiProblem
} from "../../../shared/api";
import type {
  WorkflowAssignmentMode,
  WorkflowConfigurationDirectory,
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement,
  WorkflowPublishAccepted,
  WorkflowPublishedVersion,
  WorkflowPublicationIssue,
  WorkflowPublicationValidationAccepted,
  WorkflowProcessField,
  WorkflowDraftSaveAccepted,
  WorkflowStarterMode,
  WorkflowElementType
} from "./types";
import type { XYPosition } from "@xyflow/react";
import { addWorkflowElementCommand, adaptFlowConnection } from "./flow";

const workflowDesignClient = createApiClient({ baseUrl: "/api/v1" });
export type WorkflowSaveCommand = {
  requestKey: string;
  expectedRevision: DraftRevision;
  draft: WorkflowDraftDocument;
};

export type WorkflowEditorOperation =
  | { kind: "add"; status: "accepted"; elementId: string }
  | { kind: "add"; status: "rejected"; reason: "cardinality" }
  | { kind: "connect"; status: "accepted"; connectionId: string }
  | {
      kind: "connect";
      status: "rejected";
      reason:
        | "missing-endpoint"
        | "invalid-direction"
        | "duplicate"
        | "cycle"
        | "maximum-cardinality";
    };

export type WorkflowDraftEditorState = {
  localDraft: WorkflowDraftDocument;
  hasLocalChanges: boolean;
  saveStatus: "idle" | "unsaved" | "saving" | "retrying" | "saved" | "conflict" | "error";
  errorCode: string | null;
  errorMessages: string[];
  invalidFieldNames: string[];
  lastAcknowledgedRevision: DraftRevision;
  pendingSaveCommand: WorkflowSaveCommand | null;
  conflictSnapshot: WorkflowDraftDocument | null;
  conflictLatestLoaded: boolean;
  revisionRecoveryRequired: boolean;
  retryCount: number;
  publicationStatus: "idle" | "validating" | "error" | "success";
  publicationErrorCode: string | null;
  publicationIssues: WorkflowPublicationIssue[];
  activePublicationRequestKey: string | null;
  publishStatus: "idle" | "publishing" | "success" | "error";
  publishErrorCode: string | null;
  publishErrorMessage: string | null;
  activePublishRequestKey: string | null;
  publishedVersion: WorkflowPublishedVersion | null;
  focusedChecklistSection: "starter" | "assignment" | "canvas" | "field" | null;
  selectedElementId: string | null;
  selectedConnectionId: string | null;
  presentationPositions: Record<string, XYPosition>;
  lastOperation: WorkflowEditorOperation | null;
  operationSequence: number;
  lastValidatedRevision: DraftRevision | null;
  validatedRevisionPublishable: boolean;
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
  pendingSaveCommand: null,
  conflictSnapshot: null,
  conflictLatestLoaded: false,
  revisionRecoveryRequired: false,
  retryCount: 0,
  saveStatus: "idle",
  errorCode: null,
  errorMessages: [],
  invalidFieldNames: [],
  publicationStatus: "idle",
  publicationErrorCode: null,
  publicationIssues: [],
  activePublicationRequestKey: null,
  publishStatus: "idle",
  publishErrorCode: null,
  publishErrorMessage: null,
  activePublishRequestKey: null,
  publishedVersion: null,
  focusedChecklistSection: null,
  selectedElementId: null,
  selectedConnectionId: null,
  presentationPositions: {},
  lastOperation: null,
  operationSequence: 0,
  lastValidatedRevision: null,
  validatedRevisionPublishable: false
});

const clearPublicationState = (
  state: Omit<
    WorkflowDraftEditorState,
    | "publicationStatus"
    | "publicationErrorCode"
    | "publicationIssues"
    | "activePublicationRequestKey"
    | "publishStatus"
    | "publishErrorCode"
    | "publishErrorMessage"
    | "activePublishRequestKey"
    | "publishedVersion"
    | "lastValidatedRevision"
    | "validatedRevisionPublishable"
    | "revisionRecoveryRequired"
  >
): WorkflowDraftEditorState => ({
  ...state,
  publicationStatus: "idle",
  publicationErrorCode: null,
  publicationIssues: [],
  activePublicationRequestKey: null,
  publishStatus: "idle",
  publishErrorCode: null,
  publishErrorMessage: null,
  activePublishRequestKey: null,
  publishedVersion: null,
  lastValidatedRevision: null,
  validatedRevisionPublishable: false,
  revisionRecoveryRequired: false
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
        pendingSaveCommand: null,
        conflictSnapshot: null,
        conflictLatestLoaded: false,
        retryCount: 0,
        saveStatus: force ? "saved" : "idle",
        errorCode: null,
        errorMessages: [],
        invalidFieldNames: [],
        focusedChecklistSection: state.focusedChecklistSection,
        selectedElementId: state.selectedElementId,
        selectedConnectionId: state.selectedConnectionId,
        presentationPositions: state.presentationPositions,
        lastOperation: state.lastOperation,
        operationSequence: state.operationSequence
      });

export const addGuidedWorkflowElement = (
  draft: WorkflowDraftDocument,
  type: WorkflowElementType,
  labels: WorkflowElementLabels
): WorkflowDraftDocument => {
  if (type !== "task" && draft.elements.some((element) => element.type === type)) {
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
    targetId,
    label: null
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
    | {
        type: "element-added";
        elementType: WorkflowElementType;
        labels: WorkflowElementLabels;
        position?: XYPosition;
      }
    | { type: "connected"; sourceId: string; targetId: string }
    | { type: "flow-connected"; sourceId: string; targetId: string }
    | { type: "element-selected"; elementId: string | null }
    | { type: "connection-selected"; connectionId: string | null }
    | { type: "task-label-changed"; elementId: string; label: string }
    | { type: "connection-label-changed"; connectionId: string; label: string }
    | { type: "element-positioned"; elementId: string; position: XYPosition }
    | { type: "short-text-configured"; field: ShortTextFieldDraft }
    | { type: "first-task-binding-toggled"; enabled: boolean }
    | { type: "starter-mode-selected"; mode: WorkflowStarterMode }
    | { type: "starter-team-toggled"; teamId: string }
    | { type: "starter-membership-toggled"; membershipId: string }
    | { type: "assignment-mode-selected"; mode: WorkflowAssignmentMode }
    | { type: "assignment-membership-selected"; membershipId: string }
    | { type: "save-requested"; command: WorkflowSaveCommand; retry: boolean }
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
    | { type: "publish-requested"; requestKey: string }
    | {
        type: "publish-failed";
        requestKey: string;
        errorCode: string;
        errorMessage: string;
        issues: WorkflowPublicationIssue[];
      }
    | {
        type: "publish-succeeded";
        requestKey: string;
        accepted: WorkflowPublishAccepted;
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
      pendingSaveCommand: null,
      conflictSnapshot: state.saveStatus === "conflict" ? state.conflictSnapshot : null,
      retryCount: 0,
      saveStatus: "unsaved",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    });

  if (action.type === "start-added") {
    return reduceWorkflowDraftEditorState(state, {
      type: "element-added",
      elementType: "start",
      labels: action.labels
    });
  }

  if (action.type === "task-added") {
    return reduceWorkflowDraftEditorState(state, {
      type: "element-added",
      elementType: "task",
      labels: action.labels
    });
  }

  if (action.type === "end-added") {
    return reduceWorkflowDraftEditorState(state, {
      type: "element-added",
      elementType: "end",
      labels: action.labels
    });
  }

  if (action.type === "element-added") {
    const result = addWorkflowElementCommand(
      state.localDraft,
      action.elementType,
      action.labels
    );
    if (!result.accepted) {
      return {
        ...state,
        lastOperation: { kind: "add", status: "rejected", reason: result.reason },
        operationSequence: state.operationSequence + 1
      };
    }
    return {
      ...markDirty(result.draft),
      selectedElementId: result.elementId,
      selectedConnectionId: null,
      presentationPositions: action.position
        ? { ...state.presentationPositions, [result.elementId]: action.position }
        : state.presentationPositions,
      lastOperation: { kind: "add", status: "accepted", elementId: result.elementId },
      operationSequence: state.operationSequence + 1
    };
  }

  if (action.type === "connected") {
    return reduceWorkflowDraftEditorState(state, {
      type: "flow-connected",
      sourceId: action.sourceId,
      targetId: action.targetId
    });
  }

  if (action.type === "flow-connected") {
    const result = adaptFlowConnection(state.localDraft, {
      source: action.sourceId,
      target: action.targetId,
      sourceHandle: null,
      targetHandle: null
    });
    if (!result.accepted) {
      return {
        ...state,
        lastOperation: { kind: "connect", status: "rejected", reason: result.reason },
        operationSequence: state.operationSequence + 1
      };
    }
    return {
      ...markDirty(result.draft),
      selectedElementId: null,
      selectedConnectionId: result.connectionId,
      lastOperation: {
        kind: "connect",
        status: "accepted",
        connectionId: result.connectionId
      },
      operationSequence: state.operationSequence + 1
    };
  }

  if (action.type === "element-selected") {
    return {
      ...state,
      selectedElementId: action.elementId,
      selectedConnectionId: null
    };
  }

  if (action.type === "connection-selected") {
    return {
      ...state,
      selectedElementId: null,
      selectedConnectionId: action.connectionId
    };
  }

  if (action.type === "task-label-changed") {
    const element = state.localDraft.elements.find(
      (candidate) => candidate.id === action.elementId
    );
    if (!element || element.type !== "task" || element.label === action.label) return state;
    return markDirty({
      ...state.localDraft,
      elements: state.localDraft.elements.map((candidate) =>
        candidate.id === action.elementId
          ? { ...candidate, label: action.label }
          : candidate
      )
    });
  }

  if (action.type === "connection-label-changed") {
    const connection = state.localDraft.connections.find(
      (candidate) => candidate.id === action.connectionId
    );
    if (!connection) return state;
    const label = action.label.trim() ? action.label : null;
    if (connection.label === label) return state;
    return markDirty({
      ...state.localDraft,
      connections: state.localDraft.connections.map((candidate) =>
        candidate.id === action.connectionId
          ? { ...candidate, label }
          : candidate
      )
    });
  }

  if (action.type === "element-positioned") {
    return {
      ...state,
      presentationPositions: {
        ...state.presentationPositions,
        [action.elementId]: action.position
      }
    };
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
      pendingSaveCommand: action.command,
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "save-failed") {
    const nextRetryCount = action.retryable ? state.retryCount + 1 : 0;
    const nextStatus = action.conflict ? "conflict" : "error";
    return {
      ...state,
      hasLocalChanges: true,
      pendingSaveCommand: action.retryable ? state.pendingSaveCommand : null,
      conflictSnapshot: action.conflict ? structuredClone(state.localDraft) : state.conflictSnapshot,
      conflictLatestLoaded: action.conflict ? false : state.conflictLatestLoaded,
      revisionRecoveryRequired: action.conflict || state.revisionRecoveryRequired,
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
    const revisionConflict = action.errorCode === "workflow_draft_revision_conflict";
    return {
      ...state,
      publicationStatus: "error",
      publicationErrorCode: action.errorCode,
      publicationIssues: [],
      activePublicationRequestKey: null,
      lastValidatedRevision: revisionConflict ? null : state.lastValidatedRevision,
      validatedRevisionPublishable: revisionConflict
        ? false
        : state.validatedRevisionPublishable,
      revisionRecoveryRequired: revisionConflict || state.revisionRecoveryRequired
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
      activePublicationRequestKey: null,
      lastValidatedRevision:
        action.validation.publishable
        && action.validation.revision === state.lastAcknowledgedRevision
          ? (action.validation.revision as DraftRevision)
          : null,
      validatedRevisionPublishable: action.validation.publishable
    };
  }

  if (action.type === "publish-requested") {
    return {
      ...state,
      publishStatus: "publishing",
      publishErrorCode: null,
      publishErrorMessage: null,
      activePublishRequestKey: action.requestKey
    };
  }

  if (action.type === "publish-failed") {
    if (state.activePublishRequestKey !== action.requestKey) {
      return state;
    }
    const revisionConflict = action.errorCode === "workflow_draft_revision_conflict";
    return {
      ...state,
      publishStatus: "error",
      publishErrorCode: action.errorCode,
      publishErrorMessage: action.errorMessage,
      publicationIssues: action.issues,
      activePublishRequestKey: null,
      lastValidatedRevision: null,
      validatedRevisionPublishable: false,
      revisionRecoveryRequired: revisionConflict || state.revisionRecoveryRequired
    };
  }

  if (action.type === "publish-succeeded") {
    if (state.activePublishRequestKey !== action.requestKey) {
      return state;
    }
    return {
      ...state,
      localDraft: structuredClone(action.accepted.draft),
      hasLocalChanges: false,
      saveStatus: "saved",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: [],
      lastAcknowledgedRevision: action.accepted.revision as DraftRevision,
      pendingSaveCommand: null,
      conflictSnapshot: null,
      retryCount: 0,
      publicationStatus: "idle",
      publicationErrorCode: null,
      publicationIssues: [],
      activePublicationRequestKey: null,
      publishStatus: "success",
      publishErrorCode: null,
      publishErrorMessage: null,
      activePublishRequestKey: null,
      publishedVersion: action.accepted.publishedVersion,
      lastValidatedRevision: null,
      validatedRevisionPublishable: false
    };
  }

  if (action.type === "checklist-target-selected") {
    return {
      ...state,
      focusedChecklistSection: focusChecklistTarget(action.target)
    };
  }

  if (action.type === "reload-latest-succeeded") {
    const reloaded = clearPublicationState({
      ...state,
      localDraft: structuredClone(action.draftState.value),
      hasLocalChanges: false,
      lastAcknowledgedRevision: action.draftState.revision,
      pendingSaveCommand: null,
      retryCount: 0,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: [],
      focusedChecklistSection: state.focusedChecklistSection
    });
    return state.conflictSnapshot
      ? {
          ...reloaded,
          conflictSnapshot: state.conflictSnapshot,
          conflictLatestLoaded: true,
          saveStatus: "conflict"
        }
      : reloaded;
  }

  if (action.type === "reapply-conflict-draft") {
    if (!state.conflictSnapshot || !state.conflictLatestLoaded) {
      return state;
    }
    return clearPublicationState({
      ...state,
      localDraft: structuredClone(state.conflictSnapshot),
      hasLocalChanges: true,
      pendingSaveCommand: null,
      conflictSnapshot: null,
      conflictLatestLoaded: false,
      retryCount: 0,
      saveStatus: "unsaved",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: [],
      focusedChecklistSection: state.focusedChecklistSection
    });
  }

  if (
    action.type === "server-synced"
    && !state.hasLocalChanges
    && action.draftState.revision === state.lastAcknowledgedRevision
  ) {
    return state;
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
  try {
    const response = await workflowDesignClient.PUT(
      "/api/v1/workflow-design/workflows/{workflow_id}/draft/",
      {
        params: {
          path: { workflow_id: localDraft.workflowId },
          header: { "Idempotency-Key": requestKey }
        },
        body: {
          expectedRevision,
          draft: localDraft
        }
      }
    );

    if (!response.response.ok) {
      return { ok: false, error: await readApiProblem(response.response) };
    }

    return {
      ok: true,
      data: response.data as WorkflowDraftSaveAccepted
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const validateWorkflowPublication = async (
  workflowId: string,
  expectedRevision: DraftRevision,
  requestKey: string
): Promise<
  | { ok: true; data: WorkflowPublicationValidationAccepted }
  | { ok: false; error: NormalizedApiProblem }
> => {
  try {
    const response = await workflowDesignClient.POST(
      "/api/v1/workflow-design/workflows/{workflow_id}/publication-validation/",
      {
        params: {
          path: { workflow_id: workflowId },
          header: { "Idempotency-Key": requestKey }
        },
        body: {
          expectedRevision
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
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const publishWorkflow = async (
  workflowId: string,
  expectedRevision: DraftRevision,
  requestKey: string
): Promise<
  | { ok: true; data: WorkflowPublishAccepted }
  | { ok: false; error: NormalizedApiProblem }
> => {
  try {
    const response = await workflowDesignClient.POST(
      "/api/v1/workflow-design/workflows/{workflow_id}/publish/",
      {
        params: {
          path: { workflow_id: workflowId },
          header: { "Idempotency-Key": requestKey }
        },
        body: {
          expectedRevision
        }
      }
    );

    if (!response.response.ok) {
      return { ok: false, error: await readApiProblem(response.response) };
    }

    return {
      ok: true,
      data: response.data as WorkflowPublishAccepted
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const publicationIssuesFromInvalidParams = (
  invalidParams: Array<Record<string, string>> | undefined
): WorkflowPublicationIssue[] =>
  (invalidParams ?? [])
    .filter((entry) => Boolean(entry.name) && Boolean(entry.reason))
    .map((entry) => ({
      code: entry.code ?? "invalid",
      severity: "blocking",
      target: entry.name,
      elementId: null,
      fieldId: null,
      bindingId: null,
      message: entry.reason,
      actionLabel: "Review issue"
    }));

export const readWorkflowDraft = async (
  workflowId: string
): Promise<
  | { ok: true; data: WorkflowDraftSaveAccepted }
  | { ok: false; error: NormalizedApiProblem }
> => {
  try {
    const response = await workflowDesignClient.GET(
      "/api/v1/workflow-design/workflows/{workflow_id}/draft/",
      { params: { path: { workflow_id: workflowId } } }
    );

    if (!response.response.ok) {
      return { ok: false, error: await readApiProblem(response.response) };
    }

    return {
      ok: true,
      data: response.data as WorkflowDraftSaveAccepted
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const canPublishWorkflow = (state: WorkflowDraftEditorState) =>
  !state.hasLocalChanges &&
  !state.revisionRecoveryRequired &&
  (state.saveStatus === "idle" || state.saveStatus === "saved") &&
  state.validatedRevisionPublishable &&
  state.lastValidatedRevision === state.lastAcknowledgedRevision &&
  state.publicationStatus !== "validating" &&
  state.publishStatus !== "publishing" &&
  state.publishStatus !== "error";

export const hasInvalidWorkflowTaskLabels = (draft: WorkflowDraftDocument) =>
  draft.elements.some(
    (element) => element.type === "task" && element.label.trim().length === 0
  );

export const workflowPathPreview = (
  draft: WorkflowDraftDocument
): Array<WorkflowDraftElement | WorkflowDraftConnection> => {
  const orderedItems: Array<WorkflowDraftElement | WorkflowDraftConnection> = [];
  const start = draft.elements.find((element) => element.type === "start");
  if (!start) {
    return draft.elements;
  }

  const visited = new Set<string>();
  let currentElementId: string | null = start.id;
  while (currentElementId && !visited.has(currentElementId)) {
    visited.add(currentElementId);
    const element = draft.elements.find((candidate) => candidate.id === currentElementId);
    if (!element) {
      break;
    }
    orderedItems.push(element);
    const nextConnection = draft.connections.find(
      (connection) => connection.sourceId === currentElementId
    );
    if (!nextConnection) {
      break;
    }
    orderedItems.push(nextConnection);
    currentElementId = nextConnection.targetId;
  }
  return orderedItems.length > 0 ? orderedItems : draft.elements;
};

const createElementId = (
  draft: WorkflowDraftDocument,
  type: WorkflowElementType
) => {
  let nextOrdinal = 1;
  while (draft.elements.some((element) => element.id === `${type}-${nextOrdinal}`)) {
    nextOrdinal += 1;
  }
  return `${type}-${nextOrdinal}`;
};

const createConnectionId = (draft: WorkflowDraftDocument) => {
  let nextOrdinal = 1;
  while (draft.connections.some(
    (connection) => connection.id === `connection-${nextOrdinal}`
  )) {
    nextOrdinal += 1;
  }
  return `connection-${nextOrdinal}`;
};

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

export const createWorkflowPublishRequestKey = (workflowId: string) =>
  `workflow-publish-${workflowId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

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
