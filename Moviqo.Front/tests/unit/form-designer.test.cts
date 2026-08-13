import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

import {
  createFormDesignerSaveCommand,
  createFormDesignerState,
  formDesignerValidationIssues,
  formDesignerDropIndex,
  formDesignerErrorSummary,
  formDesignerRuntimeItems,
  formItemsForTask,
  reduceFormDesignerState,
  rebaseFormDesignerDraft,
  type WorkflowCreationAccepted,
} from "../../src/features/form-design";

const accepted: WorkflowCreationAccepted = {
  workflowId: "workflow-1",
  organizationId: "organization-1",
  createdByMembershipId: "membership-1",
  configurationDirectory: { memberships: [], teams: [] },
  name: "Requests",
  revision: "4",
  draft: {
    schemaVersion: 8,
    draftId: "draft-1",
    workflowId: "workflow-1",
    name: "Requests",
    status: "draft",
    elements: [
      { id: "start-1", type: "start", label: "Start" },
      { id: "task-1", type: "task", label: "Review" },
      { id: "end-1", type: "end", label: "End" },
    ],
    connections: [],
    processFields: [],
    formBindings: [],
    layout: { positions: {} },
  },
};

test("Form Designer commands preserve stable IDs, order, selection, and approved spans", () => {
  const initial = createFormDesignerState(accepted, "task-1");
  const fieldAdded = reduceFormDesignerState(initial, {
    type: "short-text-added",
    label: "Short text",
  });
  const headingAdded = reduceFormDesignerState(fieldAdded, {
    type: "structural-item-added",
    kind: "heading",
    content: "Request details",
  });
  const resized = reduceFormDesignerState(headingAdded, {
    type: "item-width-changed",
    itemId: "heading-2",
    width: "half",
  });
  const moved = reduceFormDesignerState(resized, {
    type: "item-moved",
    itemId: "heading-2",
    toIndex: 0,
  });

  assert.equal(fieldAdded.localDraft.processFields[0]?.id, "field-1");
  assert.equal(fieldAdded.selectedItemId, "binding-1");
  assert.deepEqual(formItemsForTask(moved.localDraft, "task-1").map((item) => [
    item.id,
    item.position,
    item.width,
  ]), [
    ["heading-2", 0, "half"],
    ["binding-1", 1, "full"],
  ]);
  assert.equal(moved.hasLocalChanges, true);
  assert.equal(moved.saveStatus, "unsaved");
});

test("structural items remain non-data and deleting a field placement preserves reusable data", () => {
  const fieldAdded = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "short-text-added",
    label: "Short text",
  });
  const sectionAdded = reduceFormDesignerState(fieldAdded, {
    type: "structural-item-added",
    kind: "section",
    content: "Identity",
  });
  const structural = formItemsForTask(sectionAdded.localDraft, "task-1")[1];
  assert.equal(structural?.kind, "section");
  assert.equal("fieldId" in (structural ?? {}), false);

  const removed = reduceFormDesignerState(sectionAdded, {
    type: "item-removed",
    itemId: "binding-1",
  });
  assert.equal(removed.localDraft.processFields[0]?.id, "field-1");
  assert.equal(removed.localDraft.formBindings.some((item) => item.id === "binding-1"), false);
});

test("save commands reuse an idempotency key only for the same failed payload", () => {
  const dirty = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "structural-item-added",
    kind: "divider",
    content: "",
  });
  const first = createFormDesignerSaveCommand(dirty);
  const requested = reduceFormDesignerState(dirty, { type: "save-requested", command: first });
  const failed = reduceFormDesignerState(requested, {
    type: "save-failed",
    errorCode: "api_error",
    errorMessages: ["Try again"],
    invalidFieldNames: [],
    conflict: false,
  });
  const retry = createFormDesignerSaveCommand(failed);
  const changed = reduceFormDesignerState(failed, {
    type: "structural-item-added",
    kind: "divider",
    content: "",
  });
  const nextPayload = createFormDesignerSaveCommand(changed);

  assert.equal(retry.requestKey, first.requestKey);
  assert.notEqual(nextPayload.requestKey, first.requestKey);
});

test("a definitive lease failure receives a fresh idempotency key after takeover", () => {
  const dirty = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "structural-item-added",
    kind: "divider",
    content: "",
  });
  const first = createFormDesignerSaveCommand(dirty);
  const requested = reduceFormDesignerState(dirty, { type: "save-requested", command: first });
  const leaseLost = reduceFormDesignerState(requested, {
    type: "save-failed",
    errorCode: "form_authoring_lease_lost",
    errorMessages: ["Editing authority was lost."],
    invalidFieldNames: [],
    conflict: false,
    reuseRequestKey: false,
  });

  assert.notEqual(createFormDesignerSaveCommand(leaseLost).requestKey, first.requestKey);
});

test("pointer and keyboard drops resolve to the same authoritative move index", () => {
  const items = ["binding-1", "heading-2", "divider-3"];
  assert.equal(formDesignerDropIndex(items, "binding-1", "divider-3"), 2);
  assert.equal(formDesignerDropIndex(items, "divider-3", "binding-1"), 0);
  assert.equal(formDesignerDropIndex(items, "missing", "binding-1"), null);
});

test("incomplete coherent Forms can save while presentation issues remain visible", () => {
  const dirty = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "structural-item-added",
    kind: "heading",
    content: "",
  });
  assert.deepEqual(formDesignerValidationIssues(dirty), [
    { itemId: "heading-1", property: "content", code: "content_required" },
  ]);
  assert.ok(createFormDesignerSaveCommand(dirty));
});

test("Designer invalidParams resolve item targets and retain non-field recovery", () => {
  let state = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "short-text-added",
    label: "Requester name",
  });
  state = reduceFormDesignerState(state, {
    type: "structural-item-added",
    kind: "heading",
    content: "Request details",
  });
  assert.deepEqual(formDesignerErrorSummary(
    state,
    ["processFields.field-1.label", "formBindings.heading-2.content", "nonFieldErrors"],
    ["Add a label.", "Add content.", "Try again."],
  ), {
    errors: [
      { id: "processFields.field-1.label-0", itemId: "binding-1", property: "label", message: "Add a label." },
      { id: "formBindings.heading-2.content-1", itemId: "heading-2", property: "content", message: "Add content." },
    ],
    formMessage: "Try again.",
  });
});

test("Task binding labels and Short Text presentation edit without mutating shared labels", () => {
  const configured = structuredClone(accepted);
  configured.draft.processFields = [{
    id: "field.shared",
    kind: "shortText",
    label: "Shared requester",
    helpText: "",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255,
  }];
  configured.draft.formBindings = [{
    id: "binding.task.1",
    kind: "field",
    taskElementId: "task-1",
    fieldId: "field.shared",
    position: 0,
    width: "full",
    label: null,
  }];
  let state = createFormDesignerState(configured, "task-1");
  state = reduceFormDesignerState(state, {
    type: "item-label-changed",
    itemId: "binding.task.1",
    label: "Task-specific requester",
  });
  state = reduceFormDesignerState(state, {
    type: "item-field-configuration-changed",
    itemId: "binding.task.1",
    changes: {
      helpText: "Use the legal name.",
      placeholder: "Example: Ana Pérez",
      defaultValue: "Ana",
      minimumLength: 2,
      maximumLength: 40,
    },
  });

  assert.equal(state.localDraft.processFields[0]?.label, "Shared requester");
  const binding = state.localDraft.formBindings[0];
  assert.equal(binding?.kind, "field");
  assert.equal(binding?.kind === "field" ? binding.label : null, "Task-specific requester");
  assert.deepEqual(formDesignerRuntimeItems(state)[0], {
    itemId: "binding.task.1",
    controlId: "binding.task.1",
    fieldId: "field.shared",
    kind: "shortText",
    label: "Task-specific requester",
    helpText: "Use the legal name.",
    placeholder: "Example: Ana Pérez",
    required: true,
    position: 0,
    width: "full",
    value: "Ana",
  });
});

test("an explicitly blank Task binding label survives reducer and conflict rebase", () => {
  const configured = structuredClone(accepted);
  configured.draft.processFields = [{
    id: "field.shared",
    kind: "shortText",
    label: "Shared requester",
    helpText: "",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255,
  }];
  configured.draft.formBindings = [{
    id: "binding.task.1",
    kind: "field",
    taskElementId: "task-1",
    fieldId: "field.shared",
    position: 0,
    width: "full",
    label: null,
  }];
  const state = reduceFormDesignerState(
    createFormDesignerState(configured, "task-1"),
    {
      type: "item-label-changed",
      itemId: "binding.task.1",
      label: "",
    },
  );

  const binding = state.localDraft.formBindings[0];
  assert.equal(binding?.kind === "field" ? binding.label : null, "");
  assert.deepEqual(formDesignerValidationIssues(state), []);
  assert.deepEqual(formDesignerRuntimeItems(state)[0], {
    itemId: "binding.task.1",
    controlId: "binding.task.1",
    fieldId: "field.shared",
    kind: "shortText",
    label: "Shared requester",
    labelVisuallyHidden: true,
    helpText: "",
    placeholder: "",
    required: false,
    position: 0,
    width: "full",
    value: "",
  });

  const latest = structuredClone(configured.draft);
  latest.name = "Changed elsewhere";
  const rebased = rebaseFormDesignerDraft(state, latest);
  const rebasedBinding = rebased.formBindings[0];
  assert.equal(rebasedBinding?.kind === "field" ? rebasedBinding.label : null, "");
});

test("Unicode-only invisible labels use the reusable accessible identity", () => {
  const configured = structuredClone(accepted);
  configured.draft.processFields = [{
    id: "field.shared",
    kind: "shortText",
    label: "Shared requester",
    helpText: "",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255,
  }];
  configured.draft.formBindings = [{
    id: "binding.task.1",
    kind: "field",
    taskElementId: "task-1",
    fieldId: "field.shared",
    position: 0,
    width: "full",
    label: "\u200b\u0301\u2028",
  }];
  const state = createFormDesignerState(configured, "task-1");

  assert.deepEqual(formDesignerValidationIssues(state), []);
  assert.deepEqual(formDesignerRuntimeItems(state)[0], {
    itemId: "binding.task.1",
    controlId: "binding.task.1",
    fieldId: "field.shared",
    kind: "shortText",
    label: "Shared requester",
    labelVisuallyHidden: true,
    helpText: "",
    placeholder: "",
    required: false,
    position: 0,
    width: "full",
    value: "",
  });

  state.localDraft.processFields[0]!.label = "\u200b\u0301\u2028";
  assert.deepEqual(formDesignerValidationIssues(state), [{
    itemId: "binding.task.1",
    property: "label",
    code: "label_required",
  }]);
});

test("Task-scoped Short Text configuration clones a field shared with another Task", () => {
  const shared = structuredClone(accepted);
  shared.draft.processFields = [{
    id: "field-1",
    kind: "shortText",
    label: "Shared label",
    helpText: "Shared help",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255,
  }];
  shared.draft.formBindings = [
    {
      id: "binding-1",
      kind: "field",
      taskElementId: "task-1",
      fieldId: "field-1",
      position: 0,
      width: "full",
      label: null,
    },
    {
      id: "binding-2",
      kind: "field",
      taskElementId: "task-2",
      fieldId: "field-1",
      position: 0,
      width: "full",
      label: null,
    },
  ];
  const changed = reduceFormDesignerState(createFormDesignerState(shared, "task-1"), {
    type: "item-field-configuration-changed",
    itemId: "binding-1",
    changes: { helpText: "Task-specific help" },
  });

  const firstBinding = changed.localDraft.formBindings.find((item) => item.id === "binding-1");
  const otherBinding = changed.localDraft.formBindings.find((item) => item.id === "binding-2");
  assert.equal(firstBinding?.kind === "field" ? firstBinding.fieldId : null, "field-3");
  assert.equal(otherBinding?.kind === "field" ? otherBinding.fieldId : null, "field-1");
  assert.equal(changed.localDraft.processFields.find((field) => field.id === "field-1")?.helpText, "Shared help");
  assert.equal(changed.localDraft.processFields.find((field) => field.id === "field-3")?.helpText, "Task-specific help");
});

test("correcting one mapped property retains unrelated server errors", () => {
  let state = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "structural-item-added",
    kind: "heading",
    content: "",
  });
  state = reduceFormDesignerState(state, {
    type: "save-failed",
    errorCode: "workflow_draft_invalid",
    errorMessages: ["Content", "Width", "Form"],
    invalidFieldNames: [
      "formBindings.heading-1.content",
      "formBindings.heading-1.width",
      "nonFieldErrors",
    ],
    conflict: false,
  });
  state = reduceFormDesignerState(state, {
    type: "item-content-changed",
    itemId: "heading-1",
    content: "Details",
  });

  assert.deepEqual(state.invalidFieldNames, [
    "formBindings.heading-1.width",
    "nonFieldErrors",
  ]);
  assert.deepEqual(state.errorMessages, ["Width", "Form"]);
});

test("invalidParams resolve stable identifiers containing dots", () => {
  const configured = structuredClone(accepted);
  configured.draft.processFields = [{
    id: "field.requester.name",
    kind: "shortText",
    label: "Requester",
    helpText: "",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255,
  }];
  configured.draft.formBindings = [{
    id: "binding.requester.name",
    kind: "field",
    taskElementId: "task-1",
    fieldId: "field.requester.name",
    position: 0,
    width: "full",
    label: null,
  }];
  const state = createFormDesignerState(configured, "task-1");

  assert.deepEqual(formDesignerErrorSummary(
    state,
    ["formBindings.binding.requester.name.width", "processFields.field.requester.name.helpText"],
    ["Width", "Help"],
  ).errors, [
    {
      id: "formBindings.binding.requester.name.width-0",
      itemId: "binding.requester.name",
      property: "width",
      message: "Width",
    },
    {
      id: "processFields.field.requester.name.helpText-1",
      itemId: "binding.requester.name",
      property: "helpText",
      message: "Help",
    },
  ]);
});

test("palette additions can target a grid position through the reducer", () => {
  let state = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "structural-item-added",
    kind: "heading",
    content: "Heading",
  });
  state = reduceFormDesignerState(state, {
    type: "short-text-added",
    label: "Requester",
    toIndex: 0,
  });
  assert.deepEqual(formItemsForTask(state.localDraft, "task-1").map((item) => item.id), [
    "binding-2",
    "heading-1",
  ]);
});

test("conflict recovery reapplies only the Task-scoped Form over the latest Workflow", () => {
  let local = reduceFormDesignerState(createFormDesignerState(accepted, "task-1"), {
    type: "short-text-added",
    label: "Requester name",
  });
  const latest = structuredClone(accepted.draft);
  latest.name = "Renamed by another designer";
  latest.elements = [...latest.elements, { id: "task-2", type: "task", label: "Approve" }];
  latest.formBindings = [{
    id: "heading-other",
    kind: "heading",
    taskElementId: "task-2",
    position: 0,
    width: "full",
    content: "Other task",
  }];

  const rebased = rebaseFormDesignerDraft(local, latest);

  assert.equal(rebased.name, "Renamed by another designer");
  assert.equal(rebased.elements.some((element) => element.id === "task-2"), true);
  assert.deepEqual(rebased.formBindings.map((item) => item.id), ["heading-other", "binding-1"]);
  assert.equal(rebased.processFields[0]?.id, "field-1");
});

test("the route workspace composes focused Form Designer regions without autosave", async () => {
  const root = join(process.cwd(), "src", "features", "form-design");
  const workspace = await readFile(join(root, "ui", "FormDesignerWorkspace.tsx"), "utf8");
  const controller = await readFile(join(root, "model", "useFormDesigner.ts"), "utf8");

  for (const region of [
    "FormDesignerPalette",
    "FormDesignerCanvas",
    "FormDesignerProperties",
    "TaskFormRenderer",
    "FormDesignerSaveStatus",
  ]) {
    assert.match(workspace, new RegExp(`<${region}`));
  }
  assert.doesNotMatch(controller, /autosave/i);
  assert.match(controller, /setInterval/);
  assert.match(controller, /ctrlKey|metaKey/);
  assert.match(controller, /saveFormDesignerDraft/);

  const canvas = await readFile(join(root, "ui", "FormDesignerCanvas.tsx"), "utf8");
  assert.match(workspace, /DndContext/);
  assert.match(workspace, /PointerSensor/);
  assert.match(workspace, /KeyboardSensor/);
  assert.match(workspace, /sortableKeyboardCoordinates/);
  assert.match(workspace, /pointerWithin/);
  assert.match(workspace, /formDesignerCollisionDetection/);
  assert.match(workspace, /document\.elementFromPoint/);
  assert.match(workspace, /closest\("\[data-form-designer-workspace\]"\)/);
  assert.match(workspace, /data-form-designer-workspace="true"/);
  assert.match(workspace, /event\.activatorEvent\.type !== "keydown"/);
  assert.match(workspace, /pointerDragRef\.current \? formDesignerCollisionDetection\(args\) : closestCenter\(args\)/);
  assert.match(workspace, /const handleDragOver = \(event: DragOverEvent\)/);
  assert.match(workspace, /onDragOver=\{handleDragOver\}/);
  assert.match(workspace, /keyboardDropIndexRef\.current = targetIndex/);
  assert.match(workspace, /keyboardDropIndexRef\.current = null/);
  assert.match(workspace, /String\(collision\.id\) !== formDesignerCanvasDropId/);
  assert.match(workspace, /String\(collision\.id\) !== String\(args\.active\.id\)/);
  assert.match(workspace, /style=\{\{ pointerEvents: "none" \}\}/);
  assert.match(workspace, /adjustScale=\{false\}/);
  assert.match(workspace, /initialRect \?\? activeElement\?\.getBoundingClientRect\(\)/);
  assert.match(workspace, /sourceRect\.width/);
  assert.match(workspace, /sourceRect\.height/);
  assert.match(workspace, /screenReaderInstructions/);
  assert.match(workspace, /announcements/);
  assert.match(canvas, /rectSortingStrategy/);
  assert.match(canvas, /CSS\.Translate\.toString\(sortable\.transform\)/);
  assert.doesNotMatch(canvas, /CSS\.Transform\.toString\(sortable\.transform\)/);
  assert.match(canvas, /data-form-designer-item-type=\{kind\}/);
  assert.match(canvas, /data-drop-target=\{dropTarget \|\| undefined\}/);
  assert.match(workspace, /item\.id === activeDropTargetId/);
  assert.match(canvas, /aria-label=\{selectionLabel\}/);
  assert.match(canvas, /aria-label=\{t\("formDesign\.dragHandle"\)\}/);
  assert.match(canvas, /role="tooltip"/);
  assert.match(canvas, /min-h-11 min-w-11/);
  assert.match(canvas, /item\.kind === "divider" \? "" : item\.content/);
  assert.doesNotMatch(canvas, /item\.kind === "divider" \? item\.id/);
  assert.doesNotMatch(canvas, /saveWorkflowDraft|saveDraft/);

  const palette = await readFile(join(root, "ui", "FormDesignerPalette.tsx"), "utf8");
  const typeIcon = await readFile(join(root, "ui", "FormDesignerItemTypeIcon.tsx"), "utf8");
  assert.match(palette, /useDraggable/);
  assert.match(palette, /event\.detail <= 1/);
  assert.match(palette, /width="full"/);
  assert.match(palette, /className="w-full"/);
  assert.match(palette, /items-center gap-moviqo-3 text-left/);
  assert.match(palette, /<FormDesignerItemTypeIcon kind=\{kind\}/);
  assert.doesNotMatch(palette, /const PaletteIcon/);
  assert.match(canvas, /<FormDesignerItemTypeIcon kind=\{kind\}/);
  assert.match(typeIcon, /export const FormDesignerItemTypeIcon/);
  assert.match(typeIcon, /aria-hidden="true"/);
  assert.match(typeIcon, /focusable="false"/);
  assert.match(palette, /event\.key !== "Enter"/);

  const api = await readFile(join(root, "model", "formDesignerApi.ts"), "utf8");
  assert.match(api, /form-authoring-lease/);
  assert.match(api, /form-draft/);
  assert.match(controller, /heartbeat/);
  assert.match(controller, /takeover/);
  assert.match(controller, /release/);
  assert.match(controller, /saveInFlightRef\.current/);
  assert.match(controller, /leaseRef\.current\?\.leaseToken !== lease\.leaseToken/);
  assert.match(controller, /!mountedRef\.current/);

  const packageJson = JSON.parse(await readFile(join(process.cwd(), "package.json"), "utf8"));
  assert.equal(packageJson.dependencies["@dnd-kit/core"], "6.3.1");
  assert.equal(packageJson.dependencies["@dnd-kit/sortable"], "10.0.0");
  assert.equal(packageJson.dependencies["@dnd-kit/utilities"], "3.2.2");
});
