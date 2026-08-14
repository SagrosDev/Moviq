import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";
import {
  createTaskFormCompletionIdempotencyKey,
  createTaskFormSaveIdempotencyKey,
  createDefaultShortTextDefinition,
  createDefaultStructuralItem,
  resolveFormItemRegistryEntry,
  resolveTaskFormRenderDescriptor,
  TaskFormRenderer,
  TaskFormPanel,
  completeTaskFormDocument,
  createTaskFormEditorState,
  readTaskFormDocument,
  reduceTaskFormEditorState,
  saveTaskFormDocument,
  taskFormErrorSummary,
  taskFormRetryTarget,
  type TaskCompletionDocument,
  type TaskFormDocument,
  type TaskFormRuntimeItem,
} from "../../src/features/task-form";
import {
  resolveTaskFormPageView,
  persistTaskCompletion,
  readPersistedTaskCompletion,
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

const taskCompletionDocument: TaskCompletionDocument = {
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
  destinationRoute: `/my-work/processes/${taskFormDocument.processId}`,
  handoffMessage: "The task is complete and this process reached its end."
};

test("accepted task completion is recoverable only within its organization and membership scope", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value)
  };

  persistTaskCompletion(storage, "organization-1", "membership-1", taskCompletionDocument);

  assert.deepEqual(
    readPersistedTaskCompletion(
      storage,
      "organization-1",
      "membership-1",
      taskCompletionDocument.taskId
    ),
    taskCompletionDocument
  );
  assert.equal(
    readPersistedTaskCompletion(
      storage,
      "organization-1",
      "membership-2",
      taskCompletionDocument.taskId
    ),
    null
  );

  const storedKey = values.keys().next().value;
  assert.ok(storedKey);
  values.set(storedKey, JSON.stringify({
    ...taskCompletionDocument,
    destinationRoute: "javascript:alert(1)"
  }));
  assert.equal(
    readPersistedTaskCompletion(
      storage,
      "organization-1",
      "membership-1",
      taskCompletionDocument.taskId
    ),
    null
  );
});

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

test("field and structural registries create stable discriminated definitions", () => {
  const shortText = createDefaultShortTextDefinition("task-1", 2);
  assert.deepEqual(shortText.processField, {
    id: "field-2",
    kind: "shortText",
    label: "Short text",
    helpText: "",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255,
  });
  assert.deepEqual(shortText.item, {
    id: "binding-2",
    kind: "field",
    taskElementId: "task-1",
    fieldId: "field-2",
    position: 1,
    width: "full",
    label: null,
  });
  assert.deepEqual(createDefaultStructuralItem("divider", "task-1", 3), {
    id: "divider-3",
    kind: "divider",
    taskElementId: "task-1",
    position: 2,
    width: "full",
  });
});

test("registry resolution is exhaustive and unknown kinds fail visibly", () => {
  assert.equal(resolveFormItemRegistryEntry("shortText").status, "supported");
  assert.equal(resolveFormItemRegistryEntry("section").status, "supported");
  assert.equal(resolveFormItemRegistryEntry("heading").status, "supported");
  assert.equal(resolveFormItemRegistryEntry("instruction").status, "supported");
  assert.equal(resolveFormItemRegistryEntry("divider").status, "supported");
  assert.equal(resolveFormItemRegistryEntry("future-widget").status, "unsupported");
  assert.equal(resolveFormItemRegistryEntry("__proto__").status, "unsupported");
  assert.equal(resolveFormItemRegistryEntry("constructor").status, "unsupported");
  assert.equal(resolveFormItemRegistryEntry("toString").status, "unsupported");
  const shortTextEntry = resolveFormItemRegistryEntry("shortText");
  assert.equal(shortTextEntry.status, "supported");
  assert.deepEqual(shortTextEntry.status === "supported"
    ? shortTextEntry.validatePresentation({
        itemId: "binding-invisible",
        kind: "shortText",
        label: "\u200b\u0301\u2028",
        position: 0,
        width: "full",
      })
    : [], ["label_required"]);
});

test("TaskFormRenderer composes one-column reflow and every registry item", () => {
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormRenderer, {
          disabled: false,
          invalidFieldNames: [],
          errorMessages: [],
          items: [
            { itemId: "section-1", kind: "section", content: "Identity", position: 0, width: "full" },
            { itemId: "heading-1", kind: "heading", content: "Requester", position: 1, width: "half" },
            { itemId: "instruction-1", kind: "instruction", content: "Use a legal name.", position: 2, width: "third" },
            {
              itemId: "binding-1",
              controlId: "binding-1",
              fieldId: "field-1",
              kind: "shortText",
              label: "Requester name",
              helpText: "Use the full name.",
              placeholder: "Example: Ana Perez",
              required: true,
              minimumLength: 2,
              maximumLength: 80,
              position: 3,
              width: "quarter",
              value: "",
            },
            { itemId: "divider-1", kind: "divider", position: 4, width: "full" },
            { itemId: "future-1", kind: "future-widget", position: 5, width: "full" },
          ],
          onValueChange: () => undefined,
        }),
      },
    ),
  );

  assert.match(markup, /Identity/);
  assert.match(markup, /Requester/);
  assert.match(markup, /Use a legal name/);
  assert.match(markup, /Requester name/);
  assert.match(markup, /required=""/);
  assert.match(markup, /minLength="2"/);
  assert.match(markup, /maxLength="80"/);
  assert.match(markup, /data-layout-span="quarter"/);
  assert.match(markup, /role="alert"/);
});

test("TaskFormRenderer hides an explicitly blank visual label but preserves its accessible name", () => {
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormRenderer, {
          disabled: false,
          invalidFieldNames: [],
          errorMessages: [],
          items: [{
            itemId: "binding-blank",
            controlId: "binding-blank",
            fieldId: "field-blank",
            kind: "shortText",
            label: "Requester name",
            labelVisuallyHidden: true,
            helpText: "",
            placeholder: "",
            required: true,
            position: 0,
            width: "full",
            value: "",
          }],
          onValueChange: () => undefined,
        }),
      },
    ),
  );

  assert.match(
    markup,
    /<span class="sr-only">Requester name<\/span><span aria-hidden="true"> \*<\/span>/,
  );
  assert.match(markup, /id="task-form-binding-blank"/);
});

test("registry rendering fails visibly for malformed, inherited, and prototype-key kinds", () => {
  const inheritedKind = Object.assign(Object.create({ kind: "divider" }), {
    itemId: "inherited-divider",
    position: 1,
    width: "full",
  });
  const malformedItems = [
    { itemId: "missing-content", kind: "heading", position: 0, width: "full" },
    inheritedKind,
    { itemId: "prototype-kind", kind: "__proto__", position: 2, width: "full" },
  ] as unknown as TaskFormRuntimeItem[];
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormRenderer, {
          disabled: false,
          invalidFieldNames: [],
          errorMessages: [],
          items: malformedItems,
          onValueChange: () => undefined,
        }),
      },
    ),
  );

  assert.equal((markup.match(/role="alert"/g) ?? []).length, 3);
  assert.doesNotMatch(markup, /<hr/);
  assert.equal(resolveTaskFormRenderDescriptor(inheritedKind).kind, "unsupported");
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
  assert.equal(shouldAcceptTaskFormSnapshot(clean, newer, true, true), false);
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

test("runtime invalidParams map to actionable labels and retain non-field recovery", () => {
  assert.deepEqual(taskFormErrorSummary(
    ["controls.binding-1.value", "nonFieldErrors"],
    ["Use at least 1 character.", "Try again later."],
    taskFormDocument.form.controls,
  ), {
    errors: [
      {
        id: "controls.binding-1.value-0",
        fieldId: "task-form-binding-1",
        fieldLabel: "Requester name",
        message: "Use at least 1 character.",
      },
    ],
    formMessage: "Try again later.",
  });
});

test("blank-label controls retain their accessible name in the error summary", () => {
  const hiddenLabelControl = {
    ...taskFormDocument.form.controls[0]!,
    labelVisuallyHidden: true,
  };

  assert.deepEqual(taskFormErrorSummary(
    ["controls.binding-1.value"],
    ["Use at least 1 character."],
    [hiddenLabelControl],
  ).errors, [{
    id: "controls.binding-1.value-0",
    fieldId: "task-form-binding-1",
    fieldLabel: "Requester name",
    message: "Use at least 1 character.",
  }]);
});

test("runtime invalidParams resolve known control IDs containing dots", () => {
  const dottedControl = {
    ...taskFormDocument.form.controls[0]!,
    controlId: "binding.section.1",
    label: "Dotted control",
  };
  assert.deepEqual(taskFormErrorSummary(
    ["controls.binding.section.1.value"],
    ["Correct this value."],
    [dottedControl],
  ).errors, [{
    id: "controls.binding.section.1.value-0",
    fieldId: "task-form-binding.section.1",
    fieldLabel: "Dotted control",
    message: "Correct this value.",
  }]);

  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormRenderer, {
          disabled: false,
          invalidFieldNames: ["controls.binding.section.1.value"],
          errorMessages: ["Correct this value."],
          items: [{ ...dottedControl, itemId: dottedControl.controlId }],
          onValueChange: () => undefined,
        }),
      },
    ),
  );

  assert.match(markup, /id="task-form-binding\.section\.1"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /Correct this value\./);
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
  assert.match(markup, /Workflow: Workflow intake|Flujo: Workflow intake/);
  assert.match(markup, /<dt[^>]*>Status:<\/dt><dd[^>]*>Assigned<\/dd>|<dt[^>]*>Estado:<\/dt><dd[^>]*>Asignada<\/dd>/);
  assert.doesNotMatch(markup, /Active task|Tarea activa|Revision:|RevisiÃ³n:/);
  assert.match(markup, /placeholder="Example: Ana Perez"/);
  assert.match(markup, /Save draft|Guardar borrador/);
  assert.match(markup, /Complete task|Completar tarea/);
  assert.match(markup, /disabled=""/);
  assert.match(markup, /data-variant="secondary"/);
  assert.doesNotMatch(markup, /class="button"|task-form-actions/);
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
  assert.match(markup, /role="alert"/);
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
  assert.equal(taskFormRetryTarget(failed), "complete");
  assert.equal(taskFormRetryTarget(createTaskFormEditorState(taskFormDocument)), "save");
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
      destinationRoute: `/my-work/processes/${taskFormDocument.processId}`,
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
  assert.match(markup, /process reached its end|proceso llegó a su fin/i);
  assert.match(markup, /View process timeline|Ver línea de tiempo/);
  assert.match(markup, new RegExp(`/my-work/processes/${taskFormDocument.processId}`));
  assert.doesNotMatch(markup, /The task is complete and this process reached its end\./);

  const continued = reduceTaskFormEditorState(createTaskFormEditorState(taskFormDocument), {
    type: "complete-succeeded",
    document: {
      taskId: taskFormDocument.taskId,
      processId: taskFormDocument.processId,
      workflowId: taskFormDocument.workflowId,
      workflowVersionId: taskFormDocument.workflowVersionId,
      workflowName: taskFormDocument.workflowName,
      taskTitle: taskFormDocument.taskTitle,
      taskStatus: "completed",
      processStatus: "active",
      taskRevision: "2",
      definitionRevision: "2",
      routeTargetId: "task-2",
      completedAt: "2026-08-05T12:30:00Z",
      destinationRoute: "/my-work",
      handoffMessage: "The task is complete and the next task is assigned."
    }
  });
  const continuedMarkup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(TaskFormPanel, {
          state: continued,
          onComplete: () => undefined,
          onRetrySave: () => undefined,
          onReloadLatest: () => undefined,
          onSave: () => undefined,
          onValueChange: () => undefined
        })
      }
    )
  );

  assert.match(continuedMarkup, /The task is complete\.|La tarea quedó completa\./);
  assert.match(continuedMarkup, /Process: In progress|Proceso: En curso/);
  assert.match(continuedMarkup, /any task assigned|alguna tarea asignada/);
  assert.match(continuedMarkup, /View My work|Ver Mi trabajo/);
  assert.match(continuedMarkup, /href="\/my-work"/);
  assert.doesNotMatch(continuedMarkup, /process reached its end|proceso llegó a su fin/i);
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
