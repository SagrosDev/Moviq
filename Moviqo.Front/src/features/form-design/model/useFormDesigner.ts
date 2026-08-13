import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useLanguage, type MessageKey } from "../../../shared/localization";
import type { NormalizedApiProblem } from "../../../shared/api";
import {
  readWorkflowDraft,
  type WorkflowCreationAccepted
} from "../../workflow-design";
import {
  createFormDesignerSaveCommand,
  createFormDesignerState,
  rebaseFormDesignerDraft,
  reduceFormDesignerState
} from "./formDesigner";
import {
  saveFormDesignerDraft,
  updateFormAuthoringLease,
  type FormAuthoringLease
} from "./formDesignerApi";

export type FormAuthoringLeaseState = {
  status: "acquiring" | "editable" | "readOnly" | "error";
  lease: FormAuthoringLease | null;
  messageKey: MessageKey | null;
};

const leaseFailureCodes = new Set([
  "form_authoring_lease_lost",
  "form_authoring_lease_invalid"
]);

const localizedInvalidParamKey = (
  name: string,
  code: string | undefined
): MessageKey => {
  if (name.endsWith(".label") && code === "required") {
    return "formDesign.validation.labelRequired";
  }
  if (name.endsWith(".content") && code === "required") {
    return "formDesign.validation.contentRequired";
  }
  if (code === "greater_than_maximum") {
    return "formDesign.validation.minimumGreaterThanMaximum";
  }
  if (code === "unsupported_width") return "formDesign.error.unsupportedWidth";
  if (code === "duplicate_binding_id" || code === "duplicate_field_id") {
    return "formDesign.error.duplicateIdentifier";
  }
  return "formDesign.error.invalidValue";
};

const problemMessageKey = (problem: NormalizedApiProblem): MessageKey => {
  if (leaseFailureCodes.has(problem.code)) return "formDesign.lease.lost";
  if (problem.code === "workflow_draft_revision_conflict") return "formDesign.error.conflict";
  return "formDesign.saveError";
};

export const useFormDesigner = (
  accepted: WorkflowCreationAccepted,
  taskElementId: string,
  onAccepted: (accepted: WorkflowCreationAccepted) => void,
  saveRequestToken = 0,
  onSaveResult?: (saved: boolean) => void
) => {
  const { t } = useLanguage();
  const [state, dispatch] = useReducer(
    reduceFormDesignerState,
    createFormDesignerState(accepted, taskElementId)
  );
  const [leaseState, setLeaseState] = useState<FormAuthoringLeaseState>({
    status: "acquiring",
    lease: null,
    messageKey: null
  });
  const leaseRef = useRef<FormAuthoringLease | null>(null);
  const handledSaveRequestToken = useRef(0);
  const mountedRef = useRef(true);
  const saveInFlightRef = useRef(false);

  const updateLeaseState = useCallback((next: FormAuthoringLeaseState) => {
    leaseRef.current = next.lease;
    setLeaseState(next);
  }, []);

  const transitionToReadOnly = useCallback((messageKey: MessageKey) => {
    const current = leaseRef.current;
    updateLeaseState({
      status: "readOnly",
      lease: current ? { ...current, mode: "readOnly", leaseToken: null } : null,
      messageKey
    });
  }, [updateLeaseState]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    updateLeaseState({ status: "acquiring", lease: null, messageKey: null });
    void updateFormAuthoringLease(accepted.workflowId, taskElementId, "acquire").then((result) => {
      if (!active) {
        if (
          result.ok
          && result.data.leaseToken
          && !mountedRef.current
        ) {
          void updateFormAuthoringLease(
            accepted.workflowId,
            taskElementId,
            "release",
            result.data.leaseToken
          );
        }
        return;
      }
      if (!result.ok) {
        updateLeaseState({ status: "error", lease: null, messageKey: "formDesign.lease.unavailable" });
        return;
      }
      updateLeaseState({
        status: result.data.mode,
        lease: result.data,
        messageKey: result.data.mode === "readOnly" ? "formDesign.lease.readOnly" : null
      });
    });
    return () => {
      active = false;
      const lease = leaseRef.current;
      leaseRef.current = null;
      if (lease?.leaseToken) {
        void updateFormAuthoringLease(
          accepted.workflowId,
          taskElementId,
          "release",
          lease.leaseToken
        );
      }
    };
  }, [accepted.workflowId, taskElementId, updateLeaseState]);

  useEffect(() => {
    const lease = leaseState.lease;
    if (leaseState.status !== "editable" || !lease?.leaseToken) return;
    const timer = window.setInterval(() => {
      void updateFormAuthoringLease(
        accepted.workflowId,
        taskElementId,
        "heartbeat",
        lease.leaseToken
      ).then((result) => {
        if (leaseRef.current?.leaseToken !== lease.leaseToken) return;
        if (!result.ok) {
          transitionToReadOnly(
            leaseFailureCodes.has(result.error.code)
              ? "formDesign.lease.lost"
              : "formDesign.lease.unavailable"
          );
          return;
        }
        updateLeaseState({ status: result.data.mode, lease: result.data, messageKey: null });
      });
    }, Math.max(1, lease.heartbeatAfterSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [
    accepted.workflowId,
    leaseState.lease,
    leaseState.status,
    taskElementId,
    transitionToReadOnly,
    updateLeaseState
  ]);

  const saveDraft = useCallback(async () => {
    const leaseToken = leaseRef.current?.leaseToken;
    if (
      !state.hasLocalChanges
      || state.saveStatus === "saving"
      || leaseState.status !== "editable"
      || !leaseToken
      || saveInFlightRef.current
    ) {
      return false;
    }
    saveInFlightRef.current = true;
    try {
      const command = createFormDesignerSaveCommand(state);
      dispatch({ type: "save-requested", command });
      const result = await saveFormDesignerDraft(command, taskElementId, leaseToken);
      if (!result.ok) {
        const conflict = result.error.code === "workflow_draft_revision_conflict";
        const leaseFailure = leaseFailureCodes.has(result.error.code);
        if (leaseFailure) {
          transitionToReadOnly("formDesign.lease.lost");
        }
        dispatch({
          type: "save-failed",
          errorCode: result.error.code,
          errorMessages: leaseFailure
            ? [t("formDesign.lease.lost")]
            : result.error.invalidParams.length > 0
            ? result.error.invalidParams.map((entry) => t(
                localizedInvalidParamKey(entry.name, entry.code)
              ))
            : [t(problemMessageKey(result.error))],
          invalidFieldNames: leaseFailure
            ? []
            : result.error.invalidParams.map((entry) => entry.name),
          conflict,
          reuseRequestKey: !leaseFailure
        });
        return false;
      }
      dispatch({ type: "save-succeeded", accepted: result.data });
      onAccepted(result.data);
      return true;
    } finally {
      saveInFlightRef.current = false;
    }
  }, [leaseState.status, onAccepted, state, t, taskElementId, transitionToReadOnly]);

  const releaseLease = useCallback(async () => {
    const lease = leaseRef.current;
    if (!lease?.leaseToken) return;
    leaseRef.current = null;
    await updateFormAuthoringLease(
      accepted.workflowId,
      taskElementId,
      "release",
      lease.leaseToken
    );
  }, [accepted.workflowId, taskElementId]);

  useEffect(() => {
    if (saveRequestToken <= handledSaveRequestToken.current) return;
    handledSaveRequestToken.current = saveRequestToken;
    void saveDraft().then((saved) => onSaveResult?.(saved));
  }, [onSaveResult, saveDraft, saveRequestToken]);

  const reloadLatestAndReapply = useCallback(async () => {
    const result = await readWorkflowDraft(state.localDraft.workflowId);
    if (!result.ok) {
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        errorMessages: [t("formDesign.reloadError")],
        invalidFieldNames: [],
        conflict: true
      });
      return false;
    }
    const draft = rebaseFormDesignerDraft(state, result.data.draft);
    onAccepted(result.data);
    dispatch({ type: "conflict-rebased", accepted: result.data, draft });
    return true;
  }, [onAccepted, state, t]);

  const takeOverLease = useCallback(async () => {
    updateLeaseState({ ...leaseState, status: "acquiring", messageKey: null });
    const result = await updateFormAuthoringLease(
      accepted.workflowId,
      taskElementId,
      "takeover",
      leaseRef.current?.leaseToken
    );
    if (!result.ok) {
      if (!mountedRef.current) return false;
      transitionToReadOnly("formDesign.lease.takeoverFailed");
      return false;
    }
    if (!mountedRef.current) {
      if (result.data.leaseToken) {
        await updateFormAuthoringLease(
          accepted.workflowId,
          taskElementId,
          "release",
          result.data.leaseToken
        );
      }
      return false;
    }
    updateLeaseState({
      status: result.data.mode,
      lease: result.data,
      messageKey: result.data.mode === "editable" ? null : "formDesign.lease.takeoverFailed"
    });
    return result.data.mode === "editable";
  }, [
    accepted.workflowId,
    leaseState,
    taskElementId,
    transitionToReadOnly,
    updateLeaseState
  ]);

  useEffect(() => {
    const saveWithKeyboard = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      void saveDraft();
    };
    window.addEventListener("keydown", saveWithKeyboard);
    return () => window.removeEventListener("keydown", saveWithKeyboard);
  }, [saveDraft]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!state.hasLocalChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [state.hasLocalChanges]);

  return {
    state,
    dispatch,
    leaseState,
    saveDraft,
    reloadLatestAndReapply,
    releaseLease,
    takeOverLease
  };
};
