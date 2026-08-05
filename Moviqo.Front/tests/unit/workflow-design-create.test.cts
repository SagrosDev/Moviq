import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addGuidedWorkflowElement,
  applyWorkflowDraftSave,
  canCreateWorkflow,
  connectWorkflowElements,
  createWorkflowDraftEditorState,
  createWorkflowDraftState,
  reduceWorkflowDraftEditorState,
  reduceWorkflowCreationForm,
  type WorkflowCreationAccepted,
  type WorkflowCreationFormState,
  type WorkflowDraftDocument
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
      schemaVersion: 2,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: []
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

test("guided controls can build the minimum start task end draft without drag", () => {
  const accepted: WorkflowCreationAccepted = {
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    organizationId: "01987df4-ae8a-7000-8000-000000000101",
    createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
    name: "Workflow intake",
    revision: "1",
    draft: {
      schemaVersion: 2,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: []
    }
  };
  const draftState = createWorkflowDraftState(accepted);
  const labels = { start: "Start", task: "Task", end: "End" };

  const withStart = addGuidedWorkflowElement(draftState.value, "start", labels);
  const withTask = addGuidedWorkflowElement(withStart, "task", labels);
  const withEnd = addGuidedWorkflowElement(withTask, "end", labels);
  const startConnected = connectWorkflowElements(withEnd, "start-1", "task-1");
  const complete = connectWorkflowElements(startConnected, "task-1", "end-1");

  assert.deepEqual(complete.elements.map((element) => element.label), [
    "Start",
    "Task",
    "End"
  ]);
  assert.deepEqual(complete.connections, [
    {
      id: "connection-1",
      type: "sequence",
      sourceId: "start-1",
      targetId: "task-1"
    },
    {
      id: "connection-2",
      type: "sequence",
      sourceId: "task-1",
      targetId: "end-1"
    }
  ]);
});

test("authoritative save replaces the local draft with the server revision", () => {
  const accepted: WorkflowCreationAccepted = {
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    organizationId: "01987df4-ae8a-7000-8000-000000000101",
    createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
    name: "Workflow intake",
    revision: "1",
    draft: {
      schemaVersion: 2,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: []
    }
  };

  const saved = applyWorkflowDraftSave(createWorkflowDraftState(accepted), {
    ...accepted,
    revision: "2",
    draft: {
      ...accepted.draft,
      elements: [
        { id: "start-1", type: "start", label: "Start" },
        { id: "task-1", type: "task", label: "Task" },
        { id: "end-1", type: "end", label: "End" }
      ],
      connections: [
        {
          id: "connection-1",
          type: "sequence",
          sourceId: "start-1",
          targetId: "task-1"
        },
        {
          id: "connection-2",
          type: "sequence",
          sourceId: "task-1",
          targetId: "end-1"
        }
      ]
    }
  }, "1" as never);

  assert.equal(saved.revision, "2");
  assert.equal(saved.value.connections.length, 2);
  assert.equal(saved.conflict, false);
});

test("guided controls do not create a second task in the single-path editor", () => {
  const labels = { start: "Start", task: "Task", end: "End" };
  const draft: WorkflowDraftDocument = {
    schemaVersion: 2,
    draftId: "draft-1",
    workflowId: "workflow-1",
    name: "Workflow intake",
    status: "draft",
    elements: [{ id: "task-1", type: "task", label: "Task" }],
    connections: []
  };

  const updated = addGuidedWorkflowElement(draft, "task", labels);

  assert.equal(updated.elements.length, 1);
  assert.equal(updated.elements[0]?.label, "Task");
});

test("server sync preserves local edits until a save is accepted", () => {
  const accepted: WorkflowCreationAccepted = {
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    organizationId: "01987df4-ae8a-7000-8000-000000000101",
    createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
    name: "Workflow intake",
    revision: "1",
    draft: {
      schemaVersion: 2,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: []
    }
  };
  const draftState = createWorkflowDraftState(accepted);
  const labels = { start: "Start", task: "Task", end: "End" };

  const edited = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(draftState),
    { type: "start-added", labels }
  );
  const synced = reduceWorkflowDraftEditorState(edited, {
    type: "server-synced",
    draftState
  });

  assert.equal(synced.localDraft.elements.length, 1);
  assert.equal(synced.localDraft.elements[0]?.label, "Start");
  assert.equal(synced.hasLocalChanges, true);
});
