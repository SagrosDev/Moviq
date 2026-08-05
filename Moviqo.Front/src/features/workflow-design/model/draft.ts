import {
  createDraftState,
  type DraftRevision
} from "../../../shared/drafts";
import type { WorkflowCreationAccepted, WorkflowDraftDocument } from "./types";

export const createWorkflowDraftState = (accepted: WorkflowCreationAccepted) =>
  createDraftState(normalizeWorkflowDraft(accepted.draft), accepted.revision as DraftRevision);

export const normalizeWorkflowDraft = (
  draft: WorkflowDraftDocument
): WorkflowDraftDocument => ({
  ...draft,
  publication: draft.publication ?? {
    starter: {
      mode: "unconfigured",
      teamIds: [],
      membershipIds: []
    },
    assignment: {
      mode: "unconfigured",
      membershipId: null
    }
  }
});
