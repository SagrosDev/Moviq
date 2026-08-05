import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createTaskFormSaveIdempotencyKey,
  TaskFormPanel,
  createTaskFormEditorState,
  readTaskFormDocument,
  reduceTaskFormEditorState,
  saveTaskFormDocument,
  type TaskFormDocument,
} from "../../src/features/task-form";
import { resolveTaskFormPageView } from "../../src/pages/task-form/ui/TaskFormPage";
import { LanguageProvider, memoryLanguagePreferenceAdapter } from "../../src/shared/localization";

const taskFormDocument: TaskFormDocument = {
  taskId: "01987df4-ae8a-7000-8000-000000000311",
  processId: "01987df4-ae8a-7000-8000-000000000211",
  workflowId: "01987df4-ae8a-7000-8000-000000000110",
  workflowName: "Workflow intake",
  taskTitle: "Review request",
  taskElementId: "task-1",
  status: "assigned",
  taskRevision: "1",
  definitionRevision: "2",
  actions: { saveDraft: true, complete: false },
  form: {
    controls: [
      {
        controlId: "binding-1",
        fieldId: "field-1",
        kind: "shortText",
        label: "Requester name",
        helpText: "Use the full name.",
        placeholder: "Example: Ana Perez",
        width: "full",
        position: 0,
        value: "",
      },
    ],
  },
};

test("task form editor keeps the current value in sync for controlled input state", () => {
  const initial = createTaskFormEditorState(taskFormDocument);

  const updated = reduceTaskFormEditorState(initial, {
    type: "value-updated",
    controlId: "binding-1",
    value: "Ana Perez",
  });

  assert.equal(updated.controls[0]?.value, "Ana Perez");
  assert.equal(updated.hasLocalChanges, true);
});

test("task form save failures retain field-level invalid targets and local work", () => {
  const initial = reduceTaskFormEditorState(createTaskFormEditorState(taskFormDocument), {
    type: "value-updated",
    controlId: "binding-1",
    value: "Ana Perez",
  });

  const failed = reduceTaskFormEditorState(initial, {
    type: "save-requested",
    requestKey: "task-form-save-1",
  });

  const retriable = reduceTaskFormEditorState(failed, {
    type: "save-failed",
    errorCode: "task_form_invalid",
    errorMessages: ["Use at least 1 character for this field."],
    invalidFieldNames: ["controls.binding-1.value"],
  });

  assert.equal(retriable.controls[0]?.value, "Ana Perez");
  assert.deepEqual(retriable.invalidFieldNames, ["controls.binding-1.value"]);
  assert.equal(retriable.saveStatus, "error");
  assert.equal(retriable.saveRequestKey, "task-form-save-1");
});

test("task form panel renders label, help, input, save, and disabled complete affordance", () => {
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormPanel, {
          state: createTaskFormEditorState(taskFormDocument),
          onRetrySave: () => undefined,
          onReloadLatest: () => undefined,
          onSave: () => undefined,
          onValueChange: () => undefined,
        }),
      },
    ),
  );

  assert.match(markup, /Requester name/);
  assert.match(markup, /Use the full name/);
  assert.match(markup, /01987df4/);
  assert.match(markup, /Status: Assigned|Estado: Asignada/);
  assert.match(markup, /placeholder="Example: Ana Perez"/);
  assert.match(markup, /Save draft|Guardar borrador/);
  assert.match(markup, /Complete task|Completar tarea/);
  assert.match(markup, /disabled=""/);
});

test("task form panel exposes separate retry-save and reload-latest actions on errors", () => {
  const errored = reduceTaskFormEditorState(
    reduceTaskFormEditorState(createTaskFormEditorState(taskFormDocument), {
      type: "save-requested",
      requestKey: "task-form-save-1",
    }),
    {
      type: "save-failed",
      errorCode: "api_error",
      errorMessages: ["We could not save this form. Correct the values and try again."],
      invalidFieldNames: [],
    }
  );
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormPanel, {
          state: errored,
          onRetrySave: () => undefined,
          onReloadLatest: () => undefined,
          onSave: () => undefined,
          onValueChange: () => undefined,
        }),
      }
    )
  );

  assert.match(markup, /Retry|Reintentar/);
  assert.match(markup, /Reload latest|Recargar lo ultimo/);
});

test("task form page resolves the initial load failure to the error view", () => {
  assert.equal(resolveTaskFormPageView("error", null), "error");
  assert.equal(resolveTaskFormPageView("loading", null), "loading");
  assert.equal(resolveTaskFormPageView("ready", taskFormDocument), "ready");
});

test("task form transport normalizes network failures during the initial read", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const result = await readTaskFormDocument(taskFormDocument.taskId);
    assert.equal(result.ok, false);
    if (result.ok) {
      assert.fail("expected readTaskFormDocument() to fail");
    }
    assert.equal(result.error.code, "api_error");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("task form transport normalizes network failures during save", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const state = reduceTaskFormEditorState(createTaskFormEditorState(taskFormDocument), {
      type: "value-updated",
      controlId: "binding-1",
      value: "Ana Perez",
    });
    const result = await saveTaskFormDocument(state, "task-form-save-transport");
    assert.equal(result.ok, false);
    if (result.ok) {
      assert.fail("expected saveTaskFormDocument() to fail");
    }
    assert.equal(result.error.code, "api_error");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("task form editor clears the retry key after a new edit", () => {
  const requested = reduceTaskFormEditorState(createTaskFormEditorState(taskFormDocument), {
    type: "save-requested",
    requestKey: "task-form-save-1",
  });

  const updated = reduceTaskFormEditorState(requested, {
    type: "value-updated",
    controlId: "binding-1",
    value: "Ana Perez",
  });

  assert.equal(updated.saveRequestKey, null);
});

test("task form idempotency keys are scoped to one logical save attempt", () => {
  const first = createTaskFormSaveIdempotencyKey(taskFormDocument.taskId);
  const second = createTaskFormSaveIdempotencyKey(taskFormDocument.taskId);

  assert.match(first, new RegExp(`^task-form-save-${taskFormDocument.taskId}-`));
  assert.notEqual(first, second);
});
