import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

import {
  adaptFlowConnection,
  addWorkflowElementCommand,
  canPublishWorkflow,
  createWorkflowDraftEditorState,
  createWorkflowDraftState,
  deriveWorkflowFlowElements,
  hasInvalidWorkflowTaskLabels,
  reduceWorkflowDraftEditorState,
  workflowTopologyOrder,
  type WorkflowCreationAccepted,
  type WorkflowDraftDocument,
  type WorkflowPublicationValidationAccepted
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
    schemaVersion: 5,
    draftId: "draft-1",
    workflowId: "workflow-1",
    name: "Approvals",
    status: "draft",
    elements: [],
    connections: [],
    processFields: [],
    formBindings: [],
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
  const before = structuredClone(draft);
  const flow = deriveWorkflowFlowElements(draft, {
    "task-1": { x: 420, y: 180 }
  });

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
    deriveWorkflowFlowElements(draft, {}).nodes.map((node) => [node.id, node.position])
  );
  assert.deepEqual(positions.get("start-1"), { x: 80, y: 120 });
  assert.deepEqual(positions.get("task-1"), { x: 280, y: 120 });
  assert.deepEqual(positions.get("end-1"), { x: 480, y: 120 });
  assert.deepEqual(positions.get("task-2"), { x: 680, y: 120 });
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

test("publish requires a successful explicit validation of the unchanged saved revision", () => {
  const accepted = createAccepted(completeDraft(), "3");
  const initial = createWorkflowDraftEditorState(createWorkflowDraftState(accepted));
  assert.equal(canPublishWorkflow(initial), false);

  const validation: WorkflowPublicationValidationAccepted = {
    workflowId: accepted.workflowId,
    revision: "3",
    publishable: true,
    issues: []
  };
  const validating = reduceWorkflowDraftEditorState(initial, {
    type: "publication-validation-requested",
    requestKey: "validate-1"
  });
  const validated = reduceWorkflowDraftEditorState(validating, {
    type: "publication-validation-succeeded",
    requestKey: "validate-1",
    validation
  });
  assert.equal(validated.lastValidatedRevision, "3");
  assert.equal(canPublishWorkflow(validated), true);

  const edited = reduceWorkflowDraftEditorState(validated, {
    type: "element-selected",
    elementId: "task-1"
  });
  assert.equal(edited.lastValidatedRevision, "3");
  assert.equal(canPublishWorkflow(edited), true);

  const changed = reduceWorkflowDraftEditorState(validated, {
    type: "starter-mode-selected",
    mode: "allActiveMembers"
  });
  assert.equal(changed.lastValidatedRevision, null);
  assert.equal(canPublishWorkflow(changed), false);
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
    "WorkflowSaveStatus",
    "WorkflowEditorActionBar"
  ]) {
    assert.match(editor, new RegExp(`<${region}`));
  }
  assert.doesNotMatch(editor, /<WorkflowOutline/);
  assert.match(editor, /desktop:grid-cols-\[20rem_minmax\(0,1fr\)\]/);
  assert.match(controller, /useReducer\s*\(/);
  assert.match(controller, /state\.saveStatus !== "retrying"/);
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

  assert.doesNotMatch(controller, /setTimeout|setInterval|autosave/i);
  assert.doesNotMatch(canvas, /saveWorkflowDraft|saveDraft/);
  assert.match(canvas, /ariaLabelConfig=/);
  assert.match(canvas, /EdgeLabelRenderer/);
  assert.match(canvas, /workflow-graph-summary/);
  assert.match(canvas, /moviqo-workflow-handle/);
  assert.match(canvas, /if \(disabled\) return/);
  assert.match(palette, /suppressNextClick/);
  assert.equal((transport.match(/normalizeApiProblem\(undefined, 0\)/g) ?? []).length, 4);
  assert.match(canvas, /onNodeDragStop={[\s\S]*onPosition/);
  assert.match(transport, /publication-validation[\s\S]*body:\s*{\s*expectedRevision\s*}/);
  assert.match(transport, /\/publish\/[\s\S]*body:\s*{\s*expectedRevision\s*}/);
  assert.doesNotMatch(transport, /ReactFlow|WorkflowFlowNode/);
});
