import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canCreateWorkflow,
  createWorkflowDraftState,
  reduceWorkflowCreationForm,
  type WorkflowCreationAccepted,
  type WorkflowCreationFormState
} from "../../src/features/workflow-design";

test("only designer-capable roles can create workflows", () => {
  assert.equal(canCreateWorkflow("owner"), true);
  assert.equal(canCreateWorkflow("administrator"), true);
  assert.equal(canCreateWorkflow("designer"), true);
  assert.equal(canCreateWorkflow("member"), false);
});

test("workflow draft state seeds revision 1 from the authoritative server response", () => {
  const accepted: WorkflowCreationAccepted = {
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    organizationId: "01987df4-ae8a-7000-8000-000000000101",
    createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
    name: "Workflow intake",
    revision: "1",
    draft: {
      schemaVersion: 1,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: []
    }
  };

  const state = createWorkflowDraftState(accepted);

  assert.equal(state.revision, "1");
  assert.equal(state.value.name, "Workflow intake");
  assert.equal(state.conflict, false);
});

test("invalid workflow names keep the entered value visible for correction", () => {
  const state: WorkflowCreationFormState = {
    name: "Workflow intake",
    status: "submitting",
    errorCode: null
  };

  const updated = reduceWorkflowCreationForm(state, {
    type: "server-rejected",
    errorCode: "workflow_name_conflict"
  });

  assert.deepEqual(updated, {
    name: "Workflow intake",
    status: "error",
    errorCode: "workflow_name_conflict"
  });
});

test("the UI does not report success before the server confirms creation", () => {
  const state: WorkflowCreationFormState = {
    name: "Workflow intake",
    status: "editing",
    errorCode: null
  };

  const submitting = reduceWorkflowCreationForm(state, { type: "submit-requested" });

  assert.equal(submitting.status, "submitting");
  assert.equal(submitting.errorCode, null);
});
