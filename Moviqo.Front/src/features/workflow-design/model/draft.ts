import {
  createDraftState,
  type DraftRevision
} from "../../../shared/drafts";
import type { WorkflowCreationAccepted } from "./types";

export const createWorkflowDraftState = (accepted: WorkflowCreationAccepted) =>
  createDraftState(accepted.draft, accepted.revision as DraftRevision);
