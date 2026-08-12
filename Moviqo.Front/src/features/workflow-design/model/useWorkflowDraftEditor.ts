import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { XYPosition } from "@xyflow/react";
import { createDraftState, type DraftState } from "../../../shared/drafts";
import { useLanguage } from "../../../shared/localization";
import { createWorkflowDraftState } from "./draft";
import {
  applyWorkflowDraftSave,
  canPublishWorkflow,
  canSaveWorkflow,
  createSaveIdempotencyKey,
  createWorkflowDraftEditorState,
  createWorkflowPublishRequestKey,
  hasInvalidWorkflowTaskLabels,
  publicationIssuesFromInvalidParams,
  publishWorkflow,
  readWorkflowDraft,
  reduceWorkflowDraftEditorState,
  saveWorkflowDraft,
  type WorkflowSaveCommand
} from "./editor";
import { addWorkflowElementCommand } from "./flow";
import type {
  WorkflowAssignmentMode,
  WorkflowCreationAccepted,
  WorkflowDraftDocument,
  WorkflowElementType,
  WorkflowPublicationIssue,
  WorkflowStarterMode
} from "./types";

type UseWorkflowDraftEditorOptions = {
  draftState: DraftState<WorkflowDraftDocument>;
  onAccepted: (
    draftState: DraftState<WorkflowDraftDocument>,
    accepted: WorkflowCreationAccepted
  ) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  saveRequestToken?: number;
};

export const useWorkflowDraftEditor = ({
  draftState,
  onAccepted,
  onDirtyChange,
  saveRequestToken = 0
}: UseWorkflowDraftEditorOptions) => {
  const { t } = useLanguage();
  const [state, dispatch] = useReducer(
    reduceWorkflowDraftEditorState,
    draftState,
    createWorkflowDraftEditorState
  );
  const handledSaveRequestToken = useRef(0);
  const labels = useMemo(() => ({
    start: t("workflowDesign.editor.startLabel"),
    task: t("workflowDesign.editor.taskLabel"),
    end: t("workflowDesign.editor.endLabel")
  }), [t]);

  useEffect(() => {
    dispatch({ type: "server-synced", draftState });
  }, [draftState]);

  useEffect(() => {
    onDirtyChange?.(state.hasLocalChanges);
  }, [onDirtyChange, state.hasLocalChanges]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!state.hasLocalChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [state.hasLocalChanges]);

  const saveDraft = useCallback(async (retry = false) => {
    if (!canSaveWorkflow(state)) return false;
    const command: WorkflowSaveCommand | null = retry
      ? state.pendingSaveCommand
      : {
          requestKey: createSaveIdempotencyKey(state.localDraft.workflowId),
          expectedRevision: state.lastAcknowledgedRevision,
          draft: structuredClone(state.localDraft)
        };
    if (!command) return false;

    dispatch({ type: "save-requested", command, retry });
    const result = await saveWorkflowDraft(
      command.expectedRevision,
      command.draft,
      command.requestKey
    );
    if (!result.ok) {
      const conflict = result.error.code === "workflow_draft_revision_conflict";
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        invalidFieldNames: result.error.invalidParams?.map((entry) => entry.name) ?? [],
        errorMessages: result.error.invalidParams?.length
          ? result.error.invalidParams.map(() => t("workflowDesign.editor.saveInvalidTarget"))
          : [t("workflowDesign.editor.saveError")],
        retryable:
          !conflict
          && result.error.code !== "workflow_draft_invalid"
          && result.error.code !== "idempotency_key_reused",
        conflict
      });
      return false;
    }

    const nextDraftState = applyWorkflowDraftSave(
      createDraftState(draftState.value, command.expectedRevision),
      result.data,
      command.expectedRevision
    );
    onAccepted(nextDraftState, result.data);
    dispatch({ type: "save-succeeded", draftState: nextDraftState });
    return true;
  }, [draftState.value, onAccepted, state, t]);

  useEffect(() => {
    if (saveRequestToken <= handledSaveRequestToken.current) return;
    handledSaveRequestToken.current = saveRequestToken;
    void saveDraft(false);
  }, [saveDraft, saveRequestToken]);

  useEffect(() => {
    const saveWithKeyboard = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (canSaveWorkflow(state)) {
        void saveDraft(false);
      }
    };
    window.addEventListener("keydown", saveWithKeyboard);
    return () => window.removeEventListener("keydown", saveWithKeyboard);
  }, [saveDraft, state.hasLocalChanges, state.localDraft, state.saveStatus]);

  const addElement = useCallback((
    elementType: WorkflowElementType,
    position?: XYPosition
  ) => {
    const result = addWorkflowElementCommand(state.localDraft, elementType, labels);
    dispatch({ type: "element-added", elementType, labels, position });
    return result;
  }, [labels, state.localDraft]);

  const connect = useCallback((sourceId: string, targetId: string) => {
    dispatch({ type: "flow-connected", sourceId, targetId });
  }, []);

  const publish = useCallback(async () => {
    if (!canPublishWorkflow(state)) return;
    const requestKey = createWorkflowPublishRequestKey(state.localDraft.workflowId);
    dispatch({ type: "publish-requested", requestKey });
    const result = await publishWorkflow(
      state.lastAcknowledgedRevision,
      structuredClone(state.localDraft),
      requestKey
    );
    if (!result.ok) {
      dispatch({
        type: "publish-failed",
        requestKey,
        errorCode: result.error.code,
        errorMessage: t("workflowDesign.editor.publishError"),
        issues: publicationIssuesFromInvalidParams(result.error.invalidParams)
      });
      return;
    }
    const nextDraftState = createWorkflowDraftState(result.data);
    onAccepted(nextDraftState, result.data);
    dispatch({ type: "publish-succeeded", requestKey, accepted: result.data });
  }, [onAccepted, state, t]);

  const reloadLatest = useCallback(async () => {
    const result = await readWorkflowDraft(state.localDraft.workflowId);
    if (!result.ok) {
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        invalidFieldNames: result.error.invalidParams?.map((entry) => entry.name) ?? [],
        errorMessages: [t("workflowDesign.editor.reloadError")],
        retryable: false,
        conflict: state.hasLocalChanges
      });
      return;
    }
    const nextDraftState = createWorkflowDraftState(result.data);
    onAccepted(nextDraftState, result.data);
    dispatch({ type: "reload-latest-succeeded", draftState: nextDraftState });
  }, [onAccepted, state.localDraft.workflowId, t]);

  const focusIssue = useCallback((issue: WorkflowPublicationIssue) => {
    dispatch({ type: "checklist-target-selected", target: issue.target });
    if (issue.elementId) {
      dispatch({ type: "element-selected", elementId: issue.elementId });
    }
  }, []);

  return {
    state,
    addElement,
    connect,
    saveDraft,
    publish,
    reloadLatest,
    reapplyChanges: () => dispatch({ type: "reapply-conflict-draft" }),
    selectElement: (elementId: string | null) =>
      dispatch({ type: "element-selected", elementId }),
    selectConnection: (connectionId: string | null) =>
      dispatch({ type: "connection-selected", connectionId }),
    renameTask: (elementId: string, label: string) =>
      dispatch({ type: "task-label-changed", elementId, label }),
    renameConnection: (connectionId: string, label: string) =>
      dispatch({ type: "connection-label-changed", connectionId, label }),
    positionElement: (elementId: string, position: XYPosition) =>
      dispatch({ type: "element-positioned", elementId, position }),
    selectStarterMode: (mode: WorkflowStarterMode) =>
      dispatch({ type: "starter-mode-selected", mode }),
    toggleStarterTeam: (teamId: string) =>
      dispatch({ type: "starter-team-toggled", teamId }),
    toggleStarterMembership: (membershipId: string) =>
      dispatch({ type: "starter-membership-toggled", membershipId }),
    selectAssignmentMode: (elementId: string, mode: WorkflowAssignmentMode) =>
      dispatch({ type: "assignment-mode-selected", elementId, mode }),
    selectAssignmentMembership: (elementId: string, membershipId: string) =>
      dispatch({ type: "assignment-membership-selected", elementId, membershipId }),
    removeElement: (elementId: string) =>
      dispatch({ type: "element-removed", elementId }),
    focusIssue
  };
};

export type WorkflowDraftEditorController = ReturnType<typeof useWorkflowDraftEditor>;
