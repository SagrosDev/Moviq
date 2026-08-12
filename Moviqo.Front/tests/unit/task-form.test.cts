import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";
import {
  createTaskFormCompletionIdempotencyKey,
  createTaskFormSaveIdempotencyKey,
  TaskFormPanel,
  completeTaskFormDocument,
  createTaskFormEditorState,
  readTaskFormDocument,
  reduceTaskFormEditorState,
  saveTaskFormDocument,
  type TaskFormDocument,
} from "../../src/features/task-form";
import {
  resolveTaskFormPageView,
  refreshTaskCompletionReadModels,
  taskFormDocumentFromSuccessfulRefetch,
  shouldAcceptTaskFormSnapshot
} from "../../src/pages/task-form/ui/TaskFormPage";
import { moviqoQueryKeys } from "../../src/shared/api";
import { LanguageProvider, memoryLanguagePreferenceAdapter } from "../../src/shared/localization";

const taskFormDocument: TaskFormDocument = {
  taskId: "01987df4-ae8a-7000-8000-000000000311",
  processId: "01987df4-ae8a-7000-8000-000000000211",
  workflowId: "01987df4-ae8a-7000-8000-000000000110",
  workflowVersionId: "01987df4-ae8a-7000-8000-000000000111",
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

test("task form query revisions are accepted only while the editor is clean", () => {
  const clean = createTaskFormEditorState(taskFormDocument);
  const dirty = reduceTaskFormEditorState(clean, {
    type: "value-updated",
    controlId: "binding-1",
    value: "Keep this value"
  });
  const newer = { ...taskFormDocument, taskRevision: "2" };

  assert.equal(shouldAcceptTaskFormSnapshot(clean, taskFormDocument, false), true);
  assert.equal(shouldAcceptTaskFormSnapshot(clean, newer, true), true);
  assert.equal(shouldAcceptTaskFormSnapshot(dirty, newer, true), false);
});

test("failed refetches with retained data never overwrite the local task form", () => {
  assert.equal(taskFormDocumentFromSuccessfulRefetch({
    data: { ...taskFormDocument, taskRevision: "2" },
    isSuccess: false
  }), null);
  assert.equal(taskFormDocumentFromSuccessfulRefetch({
    data: { ...taskFormDocument, taskRevision: "2" },
    isSuccess: true
  })?.taskRevision, "2");
});

test("task completion removes the form document and invalidates organization read models", async () => {
  const queryClient = new QueryClient();
  const organizationId = "organization-1";
  const taskQueryKey = moviqoQueryKeys.taskForm(organizationId, taskFormDocument.taskId);
  const otherTaskQueryKey = moviqoQueryKeys.taskForm(organizationId, "task-2");
  const myWorkQueryKey = moviqoQueryKeys.myWork(organizationId, 1, "", 1, 1, "");
  queryClient.setQueryData(taskQueryKey, taskFormDocument);
  queryClient.setQueryData(otherTaskQueryKey, { ...taskFormDocument, taskId: "task-2" });
  queryClient.setQueryData(myWorkQueryKey, {
    myProcesses: { items: [], limit: 12, hasMore: false },
    myTasks: { items: [], limit: 12, hasMore: false },
    startWorkflows: { items: [], limit: 6, hasMore: false }
  });

  await refreshTaskCompletionReadModels(queryClient, organizationId, taskQueryKey);

  assert.equal(queryClient.getQueryData(taskQueryKey), undefined);
  assert.equal(queryClient.getQueryState(otherTaskQueryKey)?.isInvalidated, true);
  assert.equal(queryClient.getQueryState(myWorkQueryKey)?.isInvalidated, true);
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
          onComplete: () => undefined,
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
          onComplete: () => undefined,
          onRetrySave: () => undefined,
          onReloadLatest: () => undefined,
          onSave: () => undefined,
          onValueChange: () => undefined,
        }),
      }
    )
  );

  assert.match(markup, /Retry|Reintentar/);
  assert.match(markup, /Reload latest|Cargar última versión/);
});

test("task form completion failures retain local values and invalid field targets", () => {
  const initial = reduceTaskFormEditorState(createTaskFormEditorState(taskFormDocument), {
    type: "value-updated",
    controlId: "binding-1",
    value: "Ana Perez",
  });

  const requested = reduceTaskFormEditorState(initial, {
    type: "complete-requested",
    requestKey: "task-form-complete-1",
  });

  const failed = reduceTaskFormEditorState(requested, {
    type: "complete-failed",
    errorCode: "task_form_invalid",
    errorMessages: ["Use at least 1 character for this field."],
    invalidFieldNames: ["controls.binding-1.value"],
  });

  assert.equal(failed.controls[0]?.value, "Ana Perez");
  assert.equal(failed.completionStatus, "error");
  assert.equal(failed.completionRequestKey, "task-form-complete-1");
  assert.deepEqual(failed.invalidFieldNames, ["controls.binding-1.value"]);
});

test("task form completion success disables follow-up editing and shows the handoff state", () => {
  const completed = reduceTaskFormEditorState(createTaskFormEditorState(taskFormDocument), {
    type: "complete-succeeded",
    document: {
      taskId: taskFormDocument.taskId,
      processId: taskFormDocument.processId,
      workflowId: taskFormDocument.workflowId,
      workflowVersionId: taskFormDocument.workflowVersionId,
      workflowName: taskFormDocument.workflowName,
      taskTitle: taskFormDocument.taskTitle,
      taskStatus: "completed",
      processStatus: "completed",
      taskRevision: "2",
      definitionRevision: "2",
      routeTargetId: "end-1",
      completedAt: "2026-08-05T12:30:00Z",
      destinationRoute: "/my-work",
      handoffMessage: "The task is complete and this process reached its end.",
    },
  });
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormPanel, {
          state: completed,
          onComplete: () => undefined,
          onRetrySave: () => undefined,
          onReloadLatest: () => undefined,
          onSave: () => undefined,
          onValueChange: () => undefined,
        }),
      }
    )
  );

  assert.equal(completed.actions.complete, false);
  assert.equal(completed.completionStatus, "success");
  assert.match(markup, /process reached its end|proceso llego a su fin/i);
  assert.match(markup, /Back to My work|Volver a Mi trabajo/);
});

test("task form panel disables completion while a draft save is pending", () => {
  const saving = reduceTaskFormEditorState(
    reduceTaskFormEditorState(createTaskFormEditorState({
      ...taskFormDocument,
      actions: { saveDraft: true, complete: true },
    }), {
      type: "value-updated",
      controlId: "binding-1",
      value: "Ana Perez",
    }),
    {
      type: "save-requested",
      requestKey: "task-form-save-pending",
    }
  );

  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormPanel, {
          state: saving,
          onComplete: () => undefined,
          onRetrySave: () => undefined,
          onReloadLatest: () => undefined,
          onSave: () => undefined,
          onValueChange: () => undefined,
        }),
      }
    )
  );

  assert.match(markup, /Saving draft|Guardando borrador/);
  assert.match(markup, /Complete task|Completar tarea/);
  assert.match(markup, /disabled=""/);
});

test("task form page resolves the initial load failure to the error view", () => {
  assert.equal(resolveTaskFormPageView("error", null), "error");
  assert.equal(resolveTaskFormPageView("error", taskFormDocument), "ready");
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

test("task form transport normalizes network failures during completion", async () => {
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
    const result = await completeTaskFormDocument(state, "task-form-complete-transport");
    assert.equal(result.ok, false);
    if (result.ok) {
      assert.fail("expected completeTaskFormDocument() to fail");
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

test("task form completion idempotency keys are scoped to one logical completion attempt", () => {
  const first = createTaskFormCompletionIdempotencyKey(taskFormDocument.taskId);
  const second = createTaskFormCompletionIdempotencyKey(taskFormDocument.taskId);

  assert.match(first, new RegExp(`^task-form-complete-${taskFormDocument.taskId}-`));
  assert.notEqual(first, second);
});
