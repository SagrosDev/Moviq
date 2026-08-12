import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addGuidedWorkflowElement,
  applyWorkflowDraftSave,
  canPublishWorkflow,
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
  type WorkflowPublishAccepted,
  type WorkflowPublicationValidationAccepted
} from "../../src/features/workflow-design";

const createAccepted = (
  draftOverrides: Partial<WorkflowDraftDocument> = {},
  revision = "1"
): WorkflowCreationAccepted => ({
  workflowId: "01987df4-ae8a-7000-8000-000000000110",
  organizationId: "01987df4-ae8a-7000-8000-000000000101",
  createdByMembershipId: "01987df4-ae8a-7000-8000-000000000102",
  configurationDirectory: {
    memberships: [
      {
        membershipId: "01987df4-ae8a-7000-8000-000000000102",
        displayName: "Designer",
        role: "designer"
      }
    ],
    teams: []
  },
  name: "Workflow intake",
  revision,
  draft: {
    schemaVersion: 6,
    draftId: "01987df4-ae8a-7000-8000-000000000111",
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    name: "Workflow intake",
    status: "draft",
    elements: [],
    connections: [],
    processFields: [],
    formBindings: [],
    layout: { positions: {} },
    ...draftOverrides
  }
});

test("only designer-capable roles can create workflows", () => {
  assert.equal(canCreateWorkflow("owner"), true);
  assert.equal(canCreateWorkflow("administrator"), true);
  assert.equal(canCreateWorkflow("designer"), true);
  assert.equal(canCreateWorkflow("member"), false);
});

test("workflow draft state seeds revision 1 from the authoritative server response", () => {
  const accepted = createAccepted();

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
  const accepted = createAccepted();
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
      targetId: "task-1",
      label: null
    },
    {
      id: "connection-2",
      type: "sequence",
      sourceId: "task-1",
      targetId: "end-1",
      label: null
    }
  ]);
});

test("authoritative save replaces the local draft with the server revision", () => {
  const accepted = createAccepted();

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

test("guided controls create stable sequential IDs for multiple tasks", () => {
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
    formBindings: [],
    layout: { positions: {} }
  };

  const updated = addGuidedWorkflowElement(draft, "task", labels);

  assert.equal(updated.elements.length, 2);
  assert.equal(updated.elements[1]?.id, "task-2");
  assert.equal(updated.elements[1]?.label, "Task 2");
});

test("server sync preserves local edits until a save is accepted", () => {
  const accepted = createAccepted();
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
    formBindings: [],
    layout: { positions: {} }
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
    formBindings: [],
    layout: { positions: {} }
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
  const accepted = createAccepted();

  const state = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "save-failed",
      errorCode: "workflow_draft_invalid",
      errorMessages: ["Use 255 or fewer for maximum length."],
      invalidFieldNames: ["processFields.field-1.maximumLength"],
      retryable: false,
      conflict: false
    }
  );

  assert.equal(state.saveStatus, "error");
  assert.deepEqual(state.invalidFieldNames, ["processFields.field-1.maximumLength"]);
  assert.deepEqual(state.errorMessages, ["Use 255 or fewer for maximum length."]);
});

test("local semantic edits remain unsaved without creating a background command", () => {
  const accepted = createAccepted();
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(accepted));

  const edited = reduceWorkflowDraftEditorState(initial, {
    type: "start-added",
    labels: { start: "Start", task: "Task", end: "End" }
  });
  const editedAgain = reduceWorkflowDraftEditorState(edited, {
    type: "task-added",
    labels: { start: "Start", task: "Task", end: "End" }
  });

  assert.equal(edited.saveStatus, "unsaved");
  assert.equal(edited.pendingSaveCommand, null);
  assert.equal(editedAgain.pendingSaveCommand, null);
});

test("retryable save failures preserve the immutable explicit command", () => {
  const accepted = createAccepted();
  const edited = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "start-added",
      labels: { start: "Start", task: "Task", end: "End" }
    }
  );
  const requested = reduceWorkflowDraftEditorState(edited, {
    type: "save-requested",
    command: {
      requestKey: "save-1",
      expectedRevision: "1" as never,
      draft: structuredClone(edited.localDraft)
    },
    retry: false
  });
  const failed = reduceWorkflowDraftEditorState(requested, {
    type: "save-failed",
    errorCode: "network_error",
    errorMessages: ["Try again."],
    invalidFieldNames: [],
    retryable: true,
    conflict: false
  });

  const retryRequested = reduceWorkflowDraftEditorState(failed, {
    type: "save-requested",
    command: failed.pendingSaveCommand!,
    retry: true
  });

  assert.equal(failed.saveStatus, "error");
  assert.equal(failed.retryCount, 1);
  assert.equal(failed.pendingSaveCommand?.requestKey, "save-1");
  assert.deepEqual(failed.pendingSaveCommand?.draft, requested.pendingSaveCommand?.draft);
  assert.equal(failed.hasLocalChanges, true);
  assert.equal(retryRequested.saveStatus, "retrying");
});

test("terminal idempotency reuse clears the failed command until the user saves again", () => {
  const accepted = createAccepted();
  const edited = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "start-added",
      labels: { start: "Start", task: "Task", end: "End" }
    }
  );
  const requested = reduceWorkflowDraftEditorState(edited, {
    type: "save-requested",
    command: {
      requestKey: "save-1",
      expectedRevision: "1" as never,
      draft: structuredClone(edited.localDraft)
    },
    retry: false
  });
  const failed = reduceWorkflowDraftEditorState(requested, {
    type: "save-failed",
    errorCode: "idempotency_key_reused",
    errorMessages: ["Use a new key before retrying."],
    invalidFieldNames: [],
    retryable: false,
    conflict: false
  });

  assert.equal(failed.saveStatus, "error");
  assert.equal(failed.pendingSaveCommand, null);
});

test("stale save conflicts preserve local work and support explicit reapply", () => {
  const accepted = createAccepted();
  const withStart = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "start-added",
      labels: { start: "Start", task: "Task", end: "End" }
    }
  );
  const edited = reduceWorkflowDraftEditorState(withStart, {
    type: "element-positioned",
    elementId: "start-1",
    position: { x: 320, y: 240 }
  });
  const conflicted = reduceWorkflowDraftEditorState(edited, {
    type: "save-failed",
    errorCode: "workflow_draft_revision_conflict",
    errorMessages: ["Reload the last saved draft before saving again."],
    invalidFieldNames: ["expectedRevision"],
    retryable: false,
    conflict: true
  });
  const prematureReapply = reduceWorkflowDraftEditorState(conflicted, {
    type: "reapply-conflict-draft"
  });
  const reloaded = reduceWorkflowDraftEditorState(conflicted, {
    type: "reload-latest-succeeded",
    draftState: createWorkflowDraftState(createAccepted({}, "2"))
  });
  const reapplied = reduceWorkflowDraftEditorState(reloaded, {
    type: "reapply-conflict-draft"
  });

  assert.equal(conflicted.saveStatus, "conflict");
  assert.equal(conflicted.localDraft.elements.length, 1);
  assert.equal(prematureReapply, conflicted);
  assert.equal(reloaded.hasLocalChanges, false);
  assert.equal(reloaded.lastAcknowledgedRevision, "2");
  assert.equal(reloaded.saveStatus, "conflict");
  assert.equal(reloaded.conflictLatestLoaded, true);
  assert.equal(reapplied.saveStatus, "unsaved");
  assert.equal(reapplied.localDraft.elements.length, 1);
  assert.deepEqual(reapplied.localDraft.layout.positions["start-1"], { x: 320, y: 240 });
  assert.equal(reapplied.lastAcknowledgedRevision, "2");
});

test("publication validation stores authoritative checklist issues without discarding local edits", () => {
  const accepted = createAccepted(
    {
      elements: [{ id: "start-1", type: "start", label: "Start" }]
    },
    "2"
  );
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
  const accepted = createAccepted({}, "2");

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

test("publish is blocked while local draft work is still pending", () => {
  const accepted = createAccepted({}, "2");
  const edited = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "start-added",
      labels: { start: "Start", task: "Task", end: "End" }
    }
  );

  assert.equal(canPublishWorkflow(edited), false);
});

test("publish is blocked while publication validation is in flight", () => {
  const accepted = createAccepted({}, "2");
  const validating = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(accepted)),
    {
      type: "publication-validation-requested",
      requestKey: "validate-1"
    }
  );

  assert.equal(canPublishWorkflow(validating), false);
});

test("publish success appears only after the authoritative response arrives", () => {
  const accepted = createAccepted({}, "2");
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(accepted));
  const requested = reduceWorkflowDraftEditorState(initial, {
    type: "publish-requested",
    requestKey: "publish-1"
  });
  const publishAccepted: WorkflowPublishAccepted = {
    ...accepted,
    publishedVersion: {
      versionNumber: 1,
      publishedAt: "2026-08-05T12:00:00Z",
      sourceRevision: "2",
      schemaVersion: 5
    }
  };
  const succeeded = reduceWorkflowDraftEditorState(requested, {
    type: "publish-succeeded",
    requestKey: "publish-1",
    accepted: publishAccepted
  });
  const parentSynced = reduceWorkflowDraftEditorState(succeeded, {
    type: "server-synced",
    draftState: createWorkflowDraftState(publishAccepted)
  });

  assert.equal(requested.publishStatus, "publishing");
  assert.equal(requested.publishedVersion, null);
  assert.equal(succeeded.publishStatus, "success");
  assert.equal(succeeded.publishedVersion?.versionNumber, 1);
  assert.equal(parentSynced.publishStatus, "success");
  assert.equal(parentSynced.publishedVersion?.versionNumber, 1);
});

test("stale publish failure keeps the draft intact and reports an error", () => {
  const accepted = createAccepted({}, "2");
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(accepted));
  const requested = reduceWorkflowDraftEditorState(initial, {
    type: "publish-requested",
    requestKey: "publish-1"
  });
  const failed = reduceWorkflowDraftEditorState(requested, {
    type: "publish-failed",
    requestKey: "publish-1",
    errorCode: "workflow_draft_revision_conflict",
    errorMessage: "Reload the last saved draft before publishing.",
    issues: []
  });

  assert.equal(failed.publishStatus, "error");
  assert.equal(failed.publishErrorCode, "workflow_draft_revision_conflict");
  assert.equal(failed.localDraft.workflowId, accepted.workflowId);
  assert.equal(failed.revisionRecoveryRequired, true);
  assert.equal(failed.validatedRevisionPublishable, false);
  assert.equal(canPublishWorkflow(failed), false);
});

test("invalid publish failure keeps checklist blockers actionable", () => {
  const accepted = createAccepted({}, "2");
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(accepted));
  const requested = reduceWorkflowDraftEditorState(initial, {
    type: "publish-requested",
    requestKey: "publish-1"
  });
  const failed = reduceWorkflowDraftEditorState(requested, {
    type: "publish-failed",
    requestKey: "publish-1",
    errorCode: "workflow_draft_invalid",
    errorMessage: "Choose who can start this workflow.",
    issues: [
      {
        code: "starter_missing",
        severity: "blocking",
        target: "configuration.starter",
        elementId: null,
        fieldId: null,
        bindingId: null,
        message: "Choose who can start this workflow.",
        actionLabel: "Configure starter"
      }
    ]
  });

  assert.equal(failed.publishStatus, "error");
  assert.equal(failed.publishErrorCode, "workflow_draft_invalid");
  assert.equal(failed.publicationIssues.length, 1);
  assert.equal(failed.publicationIssues[0]?.target, "configuration.starter");
});

test("checklist target focus maps to stable editor sections", () => {
  assert.equal(focusChecklistTarget("configuration.starter"), "starter");
  assert.equal(focusChecklistTarget("configuration.assignment"), "assignment");
  assert.equal(focusChecklistTarget("elements.task-1"), "canvas");
  assert.equal(focusChecklistTarget("processFields.field-1"), "field");
});

test("starter selection preserves both chosen teams and chosen members", () => {
  const accepted = createAccepted();
  accepted.configurationDirectory = {
    memberships: [
      {
        membershipId: "01987df4-ae8a-7000-8000-000000000102",
        displayName: "Designer",
        role: "designer"
      },
      {
        membershipId: "01987df4-ae8a-7000-8000-000000000103",
        displayName: "Operator",
        role: "member"
      }
    ],
    teams: [
      {
        teamId: "01987df4-ae8a-7000-8000-000000000104",
        name: "Operations",
        activeMemberCount: 1,
        membershipIds: ["01987df4-ae8a-7000-8000-000000000103"]
      }
    ]
  };

  const state = createWorkflowDraftEditorState(createWorkflowDraftState(accepted));
  const withTeam = reduceWorkflowDraftEditorState(state, {
    type: "starter-team-toggled",
    teamId: "01987df4-ae8a-7000-8000-000000000104"
  });
  const withMember = reduceWorkflowDraftEditorState(withTeam, {
    type: "starter-membership-toggled",
    membershipId: "01987df4-ae8a-7000-8000-000000000103"
  });

  assert.deepEqual(withMember.localDraft.publication?.starter.teamIds, [
    "01987df4-ae8a-7000-8000-000000000104"
  ]);
  assert.deepEqual(withMember.localDraft.publication?.starter.membershipIds, [
    "01987df4-ae8a-7000-8000-000000000103"
  ]);
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
