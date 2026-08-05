import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addGuidedWorkflowElement,
  applyWorkflowDraftSave,
  canCreateWorkflow,
  clearPublicationChecklist,
  connectWorkflowElements,
  createWorkflowDraftEditorState,
  createWorkflowDraftState,
  focusChecklistTarget,
  reduceWorkflowDraftEditorState,
  reduceWorkflowCreationForm,
  setFirstTaskFieldBinding,
  upsertShortTextProcessField,
  type WorkflowCreationAccepted,
  type WorkflowCreationFormState,
  type WorkflowDraftDocument,
  type WorkflowPublicationValidationAccepted
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
      schemaVersion: 3,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: [],
      processFields: [],
      formBindings: []
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
      schemaVersion: 3,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: [],
      processFields: [],
      formBindings: []
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
      schemaVersion: 3,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: [],
      processFields: [],
      formBindings: []
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
      ],
      processFields: [],
      formBindings: []
    }
  }, "1" as never);

  assert.equal(saved.revision, "2");
  assert.equal(saved.value.connections.length, 2);
  assert.equal(saved.conflict, false);
});

test("guided controls do not create a second task in the single-path editor", () => {
  const labels = { start: "Start", task: "Task", end: "End" };
  const draft: WorkflowDraftDocument = {
    schemaVersion: 3,
    draftId: "draft-1",
    workflowId: "workflow-1",
    name: "Workflow intake",
    status: "draft",
    elements: [{ id: "task-1", type: "task", label: "Task" }],
    connections: [],
    processFields: [],
    formBindings: []
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
      schemaVersion: 3,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: [],
      processFields: [],
      formBindings: []
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

test("guided controls can create one reusable short text field for the first task", () => {
  const draft: WorkflowDraftDocument = {
    schemaVersion: 3,
    draftId: "draft-1",
    workflowId: "workflow-1",
    name: "Workflow intake",
    status: "draft",
    elements: [{ id: "task-1", type: "task", label: "Task" }],
    connections: [],
    processFields: [],
    formBindings: []
  };

  const updated = upsertShortTextProcessField(draft, {
    label: "Requester name",
    helpText: "Use the full name.",
    placeholder: "Example",
    defaultValue: "",
    minimumLength: 1,
    maximumLength: 32
  });

  assert.deepEqual(updated.processFields, [
    {
      id: "field-1",
      kind: "shortText",
      label: "Requester name",
      helpText: "Use the full name.",
      placeholder: "Example",
      defaultValue: null,
      minimumLength: 1,
      maximumLength: 32
    }
  ]);
});

test("rebinding keeps the same field identity instead of duplicating the definition", () => {
  const draft: WorkflowDraftDocument = {
    schemaVersion: 3,
    draftId: "draft-1",
    workflowId: "workflow-1",
    name: "Workflow intake",
    status: "draft",
    elements: [{ id: "task-1", type: "task", label: "Task" }],
    connections: [],
    processFields: [
      {
        id: "field-1",
        kind: "shortText",
        label: "Requester name",
        helpText: "",
        placeholder: "",
        defaultValue: null,
        minimumLength: 0,
        maximumLength: 255
      }
    ],
    formBindings: []
  };

  const bound = setFirstTaskFieldBinding(draft, true);
  const unbound = setFirstTaskFieldBinding(bound, false);
  const rebound = setFirstTaskFieldBinding(unbound, true);

  assert.equal(rebound.processFields.length, 1);
  assert.equal(rebound.processFields[0]?.id, "field-1");
  assert.equal(rebound.formBindings.length, 1);
  assert.equal(rebound.formBindings[0]?.fieldId, "field-1");
});

test("save failures retain field-level invalid param targets for guided inputs", () => {
  const accepted: WorkflowCreationAccepted = {
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    organizationId: "01987df4-ae8a-7000-8000-000000000101",
    createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
    name: "Workflow intake",
    revision: "1",
    draft: {
      schemaVersion: 3,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: [],
      processFields: [],
      formBindings: []
    }
  };

  const state = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "save-failed",
      errorCode: "workflow_draft_invalid",
      errorMessages: ["Use 255 or fewer for maximum length."],
      invalidFieldNames: ["processFields.field-1.maximumLength"]
    }
  );

  assert.equal(state.saveStatus, "error");
  assert.deepEqual(state.invalidFieldNames, ["processFields.field-1.maximumLength"]);
  assert.deepEqual(state.errorMessages, ["Use 255 or fewer for maximum length."]);
});

test("publication validation stores authoritative checklist issues without discarding local edits", () => {
  const accepted: WorkflowCreationAccepted = {
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    organizationId: "01987df4-ae8a-7000-8000-000000000101",
    createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
    name: "Workflow intake",
    revision: "2",
    draft: {
      schemaVersion: 3,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [{ id: "start-1", type: "start", label: "Start" }],
      connections: [],
      processFields: [],
      formBindings: []
    }
  };
  const draftState = createWorkflowDraftState(accepted);
  const edited = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(draftState),
    { type: "task-added", labels: { start: "Start", task: "Task", end: "End" } }
  );
  const validation: WorkflowPublicationValidationAccepted = {
    workflowId: accepted.workflowId,
    revision: "2",
    publishable: false,
    issues: [
      {
        code: "starter_missing",
        severity: "blocking",
        target: "configuration.starter",
        elementId: null,
        fieldId: null,
        bindingId: null,
        message: "We need one more detail before publishing: choose who can start this workflow.",
        actionLabel: "Configure starter"
      }
    ]
  };

  const validating = reduceWorkflowDraftEditorState(edited, {
    type: "publication-validation-requested",
    requestKey: "request-1"
  });
  const state = reduceWorkflowDraftEditorState(validating, {
    type: "publication-validation-succeeded",
    requestKey: "request-1",
    validation
  });

  assert.equal(state.localDraft.elements.length, 2);
  assert.equal(state.publicationStatus, "success");
  assert.equal(state.publicationIssues.length, 1);
  assert.equal(state.publicationIssues[0]?.code, "starter_missing");
});

test("publication validation failure keeps the checklist retry state explicit", () => {
  const accepted: WorkflowCreationAccepted = {
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    organizationId: "01987df4-ae8a-7000-8000-000000000101",
    createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
    name: "Workflow intake",
    revision: "2",
    draft: {
      schemaVersion: 3,
      draftId: "01987df4-ae8a-7000-8000-000000000111",
      workflowId: "01987df4-ae8a-7000-8000-000000000110",
      name: "Workflow intake",
      status: "draft",
      elements: [],
      connections: [],
      processFields: [],
      formBindings: []
    }
  };

  const validating = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "publication-validation-requested",
      requestKey: "request-1"
    }
  );
  const state = reduceWorkflowDraftEditorState(
    validating,
    {
      type: "publication-validation-failed",
      requestKey: "request-1",
      errorMessage: "We could not validate publication readiness. Try again.",
      errorCode: "network_error"
    }
  );

  assert.equal(state.publicationStatus, "error");
  assert.equal(state.publicationErrorCode, "network_error");
  assert.deepEqual(state.publicationIssues, []);
});

test("checklist target focus maps to stable editor sections", () => {
  assert.equal(focusChecklistTarget("configuration.starter"), "starter");
  assert.equal(focusChecklistTarget("configuration.assignment"), "assignment");
  assert.equal(focusChecklistTarget("elements.task-1"), "canvas");
  assert.equal(focusChecklistTarget("processFields.field-1"), "field");
});

test("resolved checklist issues clear only after authoritative validation", () => {
  const cleared = clearPublicationChecklist([
    {
      code: "starter_missing",
      severity: "blocking",
      target: "configuration.starter",
      elementId: null,
      fieldId: null,
      bindingId: null,
      message: "We need one more detail before publishing: choose who can start this workflow.",
      actionLabel: "Configure starter"
    }
  ]);

  assert.deepEqual(cleared, []);
});
