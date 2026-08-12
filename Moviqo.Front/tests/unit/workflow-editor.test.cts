import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

import {
  adaptFlowConnection,
  addWorkflowElementCommand,
  canConnectWorkflowByKeyboard,
  canPublishWorkflow,
  canSaveWorkflow,
  createWorkflowDraftEditorState,
  createWorkflowDraftState,
  deriveWorkflowFlowElements,
  formatWorkflowMemberIdentity,
  hasInvalidWorkflowTaskLabels,
  publicationIssuesFromInvalidParams,
  reduceWorkflowDraftEditorState,
  workflowTopologyOrder,
  type WorkflowCreationAccepted,
  type WorkflowDraftDocument
} from "../../src/features/workflow-design";

const createAccepted = (
  draftOverrides: Partial<WorkflowDraftDocument> = {},
  revision = "1"
): WorkflowCreationAccepted => ({
  workflowId: "workflow-1",
  organizationId: "organization-1",
  createdByMembershipId: "membership-1",
  configurationDirectory: { memberships: [], teams: [] },
  name: "Approvals",
  revision,
  draft: {
    schemaVersion: 7,
    draftId: "draft-1",
    workflowId: "workflow-1",
    name: "Approvals",
    status: "draft",
    elements: [],
    connections: [],
    processFields: [],
    formBindings: [],
    layout: { positions: {} },
    ...draftOverrides
  }
});

const completeDraft = (): WorkflowDraftDocument => createAccepted({
  elements: [
    { id: "start-1", type: "start", label: "Start" },
    { id: "task-1", type: "task", label: "Review" },
    { id: "end-1", type: "end", label: "End" }
  ],
  connections: [
    { id: "connection-1", type: "sequence", sourceId: "start-1", targetId: "task-1" },
    { id: "connection-2", type: "sequence", sourceId: "task-1", targetId: "end-1" }
  ]
}).draft;

test("React Flow elements are derived from Moviqo IDs without changing the document", () => {
  const draft = completeDraft();
  draft.layout.positions["task-1"] = { x: 420, y: 180 };
  const before = structuredClone(draft);
  const flow = deriveWorkflowFlowElements(draft);

  assert.deepEqual(flow.nodes.map((node) => [node.id, node.type]), [
    ["start-1", "start"],
    ["task-1", "task"],
    ["end-1", "end"]
  ]);
  assert.deepEqual(flow.nodes[1]?.position, { x: 420, y: 180 });
  assert.deepEqual(flow.edges.map((edge) => [edge.id, edge.source, edge.target]), [
    ["connection-1", "start-1", "task-1"],
    ["connection-2", "task-1", "end-1"]
  ]);
  assert.deepEqual(flow.edges[0]?.markerEnd, {
    type: "arrowclosed",
    color: "var(--color-moviqo-ink-secondary)"
  });
  assert.deepEqual(draft, before);
});

test("fallback positions follow the saved topology before disconnected element order", () => {
  const draft = createAccepted({
    elements: [
      { id: "end-1", type: "end", label: "End" },
      { id: "task-2", type: "task", label: "Disconnected" },
      { id: "task-1", type: "task", label: "Review" },
      { id: "start-1", type: "start", label: "Start" }
    ],
    connections: [
      { id: "connection-2", type: "sequence", sourceId: "task-1", targetId: "end-1" },
      { id: "connection-1", type: "sequence", sourceId: "start-1", targetId: "task-1" }
    ]
  }).draft;

  assert.deepEqual(workflowTopologyOrder(draft), ["start-1", "task-1", "end-1", "task-2"]);
  const positions = new Map(
    deriveWorkflowFlowElements(draft).nodes.map((node) => [node.id, node.position])
  );
  assert.deepEqual(positions.get("start-1"), { x: 80, y: 120 });
  assert.deepEqual(positions.get("task-1"), { x: 280, y: 120 });
  assert.deepEqual(positions.get("end-1"), { x: 480, y: 120 });
  assert.deepEqual(positions.get("task-2"), { x: 680, y: 120 });
});

test("partial layouts allocate fallback positions away from saved nodes", () => {
  const draft = completeDraft();
  draft.layout.positions["start-1"] = { x: 280, y: 120 };
  const positions = new Map(
    deriveWorkflowFlowElements(draft).nodes.map((node) => [node.id, node.position])
  );

  assert.deepEqual(positions.get("start-1"), { x: 280, y: 120 });
  assert.notDeepEqual(positions.get("task-1"), positions.get("start-1"));
  assert.notDeepEqual(positions.get("end-1"), positions.get("task-1"));
});

test("pointer and keyboard position commands update the authoritative dirty draft", () => {
  const initial = createWorkflowDraftEditorState(
    createWorkflowDraftState(createAccepted(completeDraft(), "3"))
  );
  const moved = reduceWorkflowDraftEditorState(initial, {
    type: "element-positioned",
    elementId: "task-1",
    position: { x: 415.5, y: -72 }
  });

  assert.equal(moved.hasLocalChanges, true);
  assert.equal(moved.saveStatus, "unsaved");
  assert.deepEqual(moved.localDraft.layout.positions["task-1"], {
    x: 415.5,
    y: -72
  });
  assert.deepEqual(deriveWorkflowFlowElements(moved.localDraft).nodes[1]?.position, {
    x: 415.5,
    y: -72
  });
});

test("stale position callbacks cannot add layout entries for missing elements", () => {
  const initial = createWorkflowDraftEditorState(
    createWorkflowDraftState(createAccepted(completeDraft(), "3"))
  );
  const unchanged = reduceWorkflowDraftEditorState(initial, {
    type: "element-positioned",
    elementId: "removed-task",
    position: { x: 200, y: 100 }
  });

  assert.equal(unchanged, initial);
  assert.equal(unchanged.localDraft.layout.positions["removed-task"], undefined);
});

test("deleting a Task cascades its graph references but preserves reusable fields", () => {
  const draft = completeDraft();
  draft.processFields = [{
    id: "field-1",
    kind: "shortText",
    label: "Decision",
    helpText: "",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255
  }];
  draft.formBindings = [{
    id: "binding-1",
    taskElementId: "task-1",
    fieldId: "field-1",
    position: 0,
    width: "full",
    label: null
  }];
  draft.layout.positions["task-1"] = { x: 300, y: 100 };
  const initial = createWorkflowDraftEditorState(
    createWorkflowDraftState(createAccepted(draft, "3"))
  );
  const removed = reduceWorkflowDraftEditorState(initial, {
    type: "element-removed",
    elementId: "task-1"
  });
  const startProtected = reduceWorkflowDraftEditorState(removed, {
    type: "element-removed",
    elementId: "start-1"
  });

  assert.equal(removed.hasLocalChanges, true);
  assert.deepEqual(removed.localDraft.elements.map((element) => element.id), [
    "start-1",
    "end-1"
  ]);
  assert.deepEqual(removed.localDraft.connections, []);
  assert.deepEqual(removed.localDraft.formBindings, []);
  assert.equal(removed.localDraft.processFields[0]?.id, "field-1");
  assert.equal(removed.localDraft.layout.positions["task-1"], undefined);
  assert.equal(startProtected, removed);
});

test("each Task owns its independent assignment", () => {
  const draft = completeDraft();
  const initial = createWorkflowDraftEditorState(
    createWorkflowDraftState(createAccepted(draft, "3"))
  );
  const assigned = reduceWorkflowDraftEditorState(initial, {
    type: "assignment-mode-selected",
    elementId: "task-1",
    mode: "workflowInitiator"
  });

  assert.deepEqual(
    assigned.localDraft.elements.find((element) => element.id === "task-1")?.assignment,
    { mode: "workflowInitiator", membershipId: null }
  );
  assert.equal(assigned.localDraft.publication?.starter.mode, "unconfigured");
});

test("Workflow member identity avoids empty or duplicated email decoration", () => {
  assert.equal(
    formatWorkflowMemberIdentity("Local Owner", "owner@local.test", "membership-1"),
    "Local Owner (owner@local.test)"
  );
  assert.equal(
    formatWorkflowMemberIdentity("OWNER@LOCAL.TEST", "owner@local.test", "membership-1"),
    "owner@local.test"
  );
  assert.equal(
    formatWorkflowMemberIdentity("Legacy Owner", "", "membership-1"),
    "Legacy Owner"
  );
  assert.equal(formatWorkflowMemberIdentity("", "", "membership-1"), "membership-1");
});

test("add-at-position stores the new element coordinate in the draft", () => {
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(createAccepted()));
  const added = reduceWorkflowDraftEditorState(initial, {
    type: "element-added",
    elementType: "task",
    labels: { start: "Start", task: "Task", end: "End" },
    position: { x: 260, y: 90 }
  });

  assert.deepEqual(added.localDraft.layout.positions["task-1"], { x: 260, y: 90 });
});

test("keyboard-added elements persist their fallback canvas coordinate", () => {
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(createAccepted({
    elements: [{ id: "start-1", type: "start", label: "Start" }],
    layout: { positions: { "start-1": { x: 80, y: 120 } } }
  })));
  const added = reduceWorkflowDraftEditorState(initial, {
    type: "element-added",
    elementType: "task",
    labels: { start: "Start", task: "Task", end: "End" }
  });

  assert.deepEqual(added.localDraft.layout.positions["task-1"], { x: 280, y: 120 });
  assert.deepEqual(
    deriveWorkflowFlowElements(added.localDraft).nodes.find((node) => node.id === "task-1")?.position,
    { x: 280, y: 120 }
  );
});

test("Task and connection labels remain authoritative reducer edits", () => {
  const initial = createWorkflowDraftEditorState(
    createWorkflowDraftState(createAccepted(completeDraft(), "3"))
  );
  const renamedTask = reduceWorkflowDraftEditorState(initial, {
    type: "task-label-changed",
    elementId: "task-1",
    label: "Approve purchase"
  });
  const selectedConnection = reduceWorkflowDraftEditorState(renamedTask, {
    type: "connection-selected",
    connectionId: "connection-1"
  });
  const renamedConnection = reduceWorkflowDraftEditorState(selectedConnection, {
    type: "connection-label-changed",
    connectionId: "connection-1",
    label: "Request accepted"
  });

  assert.equal(renamedTask.localDraft.elements[1]?.label, "Approve purchase");
  assert.equal(renamedTask.hasLocalChanges, true);
  assert.equal(renamedTask.lastValidatedRevision, null);
  assert.equal(selectedConnection.selectedElementId, null);
  assert.equal(selectedConnection.selectedConnectionId, "connection-1");
  assert.equal(renamedConnection.localDraft.connections[0]?.label, "Request accepted");
  assert.equal(hasInvalidWorkflowTaskLabels(renamedConnection.localDraft), false);

  const blankTask = reduceWorkflowDraftEditorState(renamedConnection, {
    type: "task-label-changed",
    elementId: "task-1",
    label: "   "
  });
  assert.equal(blankTask.localDraft.elements[1]?.label, "   ");
  assert.equal(hasInvalidWorkflowTaskLabels(blankTask.localDraft), true);
});

test("flow connection gestures are accepted only when the Moviqo sequence invariant allows them", () => {
  const disconnected = createAccepted({
    elements: completeDraft().elements,
    connections: []
  }).draft;

  const accepted = adaptFlowConnection(disconnected, {
    source: "start-1",
    target: "task-1",
    sourceHandle: null,
    targetHandle: null
  });
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.draft.connections[0]?.type, "sequence");

  const rejected = adaptFlowConnection(disconnected, {
    source: "end-1",
    target: "start-1",
    sourceHandle: null,
    targetHandle: null
  });
  assert.deepEqual(rejected, {
    accepted: false,
    draft: disconnected,
    reason: "invalid-direction"
  });

  const occupiedTargetDraft = createAccepted({
    elements: [
      ...completeDraft().elements,
      { id: "task-2", type: "task", label: "Approve" }
    ],
    connections: [
      { id: "connection-2", type: "sequence", sourceId: "task-1", targetId: "end-1" }
    ]
  }).draft;
  const occupiedTarget = adaptFlowConnection(occupiedTargetDraft, {
    source: "task-2",
    target: "end-1",
    sourceHandle: null,
    targetHandle: null
  });
  assert.equal(occupiedTarget.accepted, false);
  assert.equal(occupiedTarget.reason, "maximum-cardinality");

  const multiTaskDraft = createAccepted({
    elements: [
      { id: "task-1", type: "task", label: "Review" },
      { id: "task-2", type: "task", label: "Approve" }
    ],
    connections: [
      { id: "connection-2", type: "sequence", sourceId: "task-1", targetId: "task-2" }
    ]
  }).draft;
  const cycle = adaptFlowConnection(multiTaskDraft, {
    source: "task-2",
    target: "task-1",
    sourceHandle: null,
    targetHandle: null
  });
  assert.equal(cycle.accepted, false);
  assert.equal(cycle.reason, "cycle");

  const sparseId = adaptFlowConnection({
    ...multiTaskDraft,
    elements: [
      ...multiTaskDraft.elements,
      { id: "end-1", type: "end", label: "End" }
    ],
    connections: [
      { id: "connection-2", type: "sequence", sourceId: "task-2", targetId: "end-1" }
    ]
  }, {
    source: "task-1",
    target: "task-2",
    sourceHandle: null,
    targetHandle: null
  });
  assert.equal(sparseId.accepted, true);
  assert.equal(sparseId.connectionId, "connection-1");
});

test("all add paths share one command with explicit acceptance and cardinality rejection", () => {
  const empty = createAccepted().draft;
  const added = addWorkflowElementCommand(
    empty,
    "start",
    { start: "Start", task: "Task", end: "End" }
  );
  assert.equal(added.accepted, true);
  assert.equal(added.elementId, "start-1");

  const rejected = addWorkflowElementCommand(
    added.draft,
    "start",
    { start: "Start", task: "Task", end: "End" }
  );
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, "cardinality");
  assert.equal(rejected.draft, added.draft);

  const firstTask = addWorkflowElementCommand(
    empty,
    "task",
    { start: "Start", task: "Task", end: "End" }
  );
  assert.equal(firstTask.accepted, true);
  const secondTask = addWorkflowElementCommand(
    firstTask.draft,
    "task",
    { start: "Start", task: "Task", end: "End" }
  );
  assert.equal(secondTask.accepted, true);
  assert.equal(secondTask.elementId, "task-2");
  assert.equal(secondTask.draft.elements[1]?.label, "Task 2");
});

test("accepted add commands select every new Task while singleton rejection stays local", () => {
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(createAccepted()));
  const added = reduceWorkflowDraftEditorState(initial, {
    type: "element-added",
    elementType: "task",
    labels: { start: "Start", task: "Task", end: "End" }
  });
  assert.equal(added.selectedElementId, "task-1");
  assert.equal(added.lastOperation?.status, "accepted");
  assert.equal(added.hasLocalChanges, true);

  const secondTask = reduceWorkflowDraftEditorState(added, {
    type: "element-added",
    elementType: "task",
    labels: { start: "Start", task: "Task", end: "End" }
  });
  assert.equal(secondTask.selectedElementId, "task-2");
  assert.equal(secondTask.lastOperation?.status, "accepted");

  const withStart = reduceWorkflowDraftEditorState(secondTask, {
    type: "element-added",
    elementType: "start",
    labels: { start: "Start", task: "Task", end: "End" }
  });
  const rejected = reduceWorkflowDraftEditorState(withStart, {
    type: "element-added",
    elementType: "start",
    labels: { start: "Start", task: "Task", end: "End" }
  });
  assert.equal(rejected.selectedElementId, "start-1");
  assert.deepEqual(rejected.lastOperation, {
    kind: "add",
    status: "rejected",
    reason: "cardinality"
  });
});

test("publish is independent and accepts the current valid local design", () => {
  const accepted = createAccepted(completeDraft(), "3");
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(accepted));
  assert.equal(canPublishWorkflow(initial), true);

  const changed = reduceWorkflowDraftEditorState(initial, {
    type: "starter-mode-selected",
    mode: "allActiveMembers"
  });
  assert.equal(changed.lastValidatedRevision, null);
  assert.equal(canPublishWorkflow(changed), true);
});

test("Save availability closes during Publish and revision recovery", () => {
  const dirty = reduceWorkflowDraftEditorState(
    createWorkflowDraftEditorState(createWorkflowDraftState(createAccepted(completeDraft(), "3"))),
    { type: "starter-mode-selected", mode: "allActiveMembers" }
  );

  assert.equal(canSaveWorkflow(dirty), true);
  assert.equal(canSaveWorkflow({ ...dirty, publishStatus: "publishing" }), false);
  assert.equal(canSaveWorkflow({ ...dirty, revisionRecoveryRequired: true }), false);
  assert.equal(canSaveWorkflow({ ...dirty, saveStatus: "retrying" }), false);
});

test("keyboard connections and publication references preserve guarded recovery context", () => {
  assert.equal(canConnectWorkflowByKeyboard(false, "task-1"), true);
  assert.equal(canConnectWorkflowByKeyboard(true, "task-1"), false);
  assert.equal(canConnectWorkflowByKeyboard(false, null), false);

  assert.deepEqual(publicationIssuesFromInvalidParams([{
    name: "elements.task-2.processFields.field-1.formBindings.binding-2",
    reason: "Reconnect this field.",
    code: "first_task_binding_missing_field"
  }]), [{
    code: "first_task_binding_missing_field",
    severity: "blocking",
    target: "elements.task-2.processFields.field-1.formBindings.binding-2",
    elementId: "task-2",
    fieldId: "field-1",
    bindingId: "binding-2",
    message: "Reconnect this field.",
    actionLabel: "Review issue"
  }]);
});

test("the Workflow editor composes focused regions and does not embed Form field editing", async () => {
  const featureRoot = join(process.cwd(), "src", "features", "workflow-design");
  const editor = await readFile(join(featureRoot, "ui", "WorkflowDraftEditor.tsx"), "utf8");
  const controller = await readFile(join(featureRoot, "model", "useWorkflowDraftEditor.ts"), "utf8");

  for (const region of [
    "WorkflowElementPalette",
    "WorkflowCanvas",
    "WorkflowProperties",
    "WorkflowPublicationConfiguration",
    "WorkflowPublicationChecklist",
    "WorkflowCompactSaveStatus",
    "WorkflowSaveStatus",
    "WorkflowEditorActionBar"
  ]) {
    assert.match(editor, new RegExp(`<${region}`));
  }
  assert.doesNotMatch(editor, /<WorkflowOutline/);
  assert.match(editor, /desktop:grid-cols-\[20rem_minmax\(0,1fr\)\]/);
  assert.match(editor, /workflowName={workflowName}/);
  assert.match(controller, /useReducer\s*\(/);
  assert.match(controller, /canSaveWorkflow\(state\)/);
  assert.match(editor, /focusedChecklistSection/);
  assert.match(editor, /onInvalidTarget/);
  assert.doesNotMatch(editor, /short-text-configured|fieldMinimumLength|fieldMaximumLength/);
});

test("editor gestures never create background save requests or a second graph payload", async () => {
  const featureRoot = join(process.cwd(), "src", "features", "workflow-design");
  const controller = await readFile(
    join(featureRoot, "model", "useWorkflowDraftEditor.ts"),
    "utf8"
  );
  const canvas = await readFile(join(featureRoot, "ui", "WorkflowCanvas.tsx"), "utf8");
  const palette = await readFile(join(featureRoot, "ui", "WorkflowElementPalette.tsx"), "utf8");
  const transport = await readFile(join(featureRoot, "model", "editor.ts"), "utf8");
  const actions = await readFile(join(featureRoot, "ui", "WorkflowEditorActions.tsx"), "utf8");
  const workspace = await readFile(join(featureRoot, "ui", "WorkflowDraftEditor.tsx"), "utf8");

  assert.doesNotMatch(controller, /setTimeout|setInterval|autosave/i);
  assert.doesNotMatch(canvas, /saveWorkflowDraft|saveDraft/);
  assert.match(canvas, /ariaLabelConfig=/);
  assert.match(canvas, /EdgeLabelRenderer/);
  assert.match(canvas, /workflow-graph-summary/);
  assert.match(canvas, /moviqo-workflow-handle/);
  assert.match(canvas, /if \(disabled\) return/);
  assert.match(canvas, /onKeyboardSource:\s*disabled\s*\? undefined/);
  assert.match(canvas, /canConnectWorkflowByKeyboard\(disabled, keyboardSourceId\)/);
  assert.match(controller, /if \(!canSaveWorkflow\(state\)\) return false/);
  assert.match(controller, /if \(canSaveWorkflow\(state\)\)/);
  assert.match(actions, /workflow-publish-error-summary/);
  assert.match(actions, /if \(!hasRecoveryFeedback\) return null/);
  assert.match(actions, /aria-live="polite"/);
  assert.doesNotMatch(actions, /<h2 className="m-0 text-base font-semibold" id="workflow-save-status-title">/);
  assert.match(workspace, /workflow-checklist-title/);
  const checklist = await readFile(join(featureRoot, "ui", "WorkflowPublicationChecklist.tsx"), "utf8");
  assert.match(checklist, /task_form_missing:\s*"workflowDesign\.editor\.issue\.taskFormMissing"/);
  assert.match(checklist, /task_binding_missing_field:\s*"workflowDesign\.editor\.issue\.taskBindingMissingField"/);
  assert.match(checklist, /task_form_decorative:\s*"workflowDesign\.editor\.issue\.taskFormDecorative"/);
  const properties = await readFile(join(featureRoot, "ui", "WorkflowProperties.tsx"), "utf8");
  assert.match(properties, /workflow-delete-element-confirm/);
  assert.match(properties, /restoreDeleteTriggerRef/);
  assert.match(properties, /formatWorkflowMemberIdentity\(/);
  assert.match(properties, /labelEmphasis="strong"/);
  assert.doesNotMatch(properties, /\{typeLabels\[selectedElement\.type\]\}\s*<\/p>/);
  assert.match(canvas, /calc\(-100% - var\(--spacing-moviqo-2\)\)/);
  assert.match(canvas, /\{workflowName\}/);
  assert.match(canvas, /markerEnd={props\.markerEnd}/);
  assert.match(canvas, /edge\.id === selectedConnectionId[\s\S]*--color-moviqo-focus/);
  assert.match(workspace, /desktop:items-stretch/);
  assert.match(palette, /suppressNextClick/);
  assert.equal((transport.match(/normalizeApiProblem\(undefined, 0\)/g) ?? []).length, 4);
  assert.match(canvas, /onNodeDragStop={[\s\S]*onPosition/);
  assert.match(transport, /\/publish\/[\s\S]*body:\s*{\s*expectedRevision,\s*draft:\s*localDraft/);
  assert.doesNotMatch(actions, /validatePublication|validatingPublication|onValidate/);
  assert.doesNotMatch(transport, /ReactFlow|WorkflowFlowNode/);
});
