import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  protectedEntryPath,
  resolveProtectedRedirectPath
} from "../../src/features/authentication";
import { MyWorkShell, myWorkQueryKey } from "../../src/features/my-work";
import {
  clearProtectedQueryState,
  createQueryRegistry,
  queryRegistry
} from "../../src/shared/api";
import { LanguageProvider, memoryLanguagePreferenceAdapter } from "../../src/shared/localization";

test("protected authentication entry path targets the my-work route", () => {
  assert.equal(protectedEntryPath, "/my-work");
  assert.equal(resolveProtectedRedirectPath("/my-work"), "/sign-in");
  assert.equal(resolveProtectedRedirectPath("/"), null);
});

test("query registry clears protected query state and records the invalidation reason", () => {
  const registry = createQueryRegistry();
  registry.setSnapshot(myWorkQueryKey, {
    status: "success",
    data: {
      myProcesses: { items: [], limit: 12, hasMore: false },
      myTasks: { items: [], limit: 12, hasMore: false },
      startWorkflows: { items: [], limit: 6, hasMore: false }
    },
    updatedAt: Date.now()
  });

  registry.clear("session-expired");

  assert.equal(registry.getSnapshot(myWorkQueryKey).status, "idle");
  assert.deepEqual(registry.getInvalidations(), [{ key: myWorkQueryKey, reason: "session-expired" }]);
});

test("shared protected query clearing resets the live my-work cache", () => {
  queryRegistry.setSnapshot(myWorkQueryKey, {
    status: "success",
    data: {
      myProcesses: { items: [], limit: 12, hasMore: false },
      myTasks: { items: [], limit: 12, hasMore: false },
      startWorkflows: { items: [], limit: 6, hasMore: false }
    },
    updatedAt: Date.now()
  });

  clearProtectedQueryState("unit-test");

  assert.equal(queryRegistry.getSnapshot(myWorkQueryKey).status, "idle");
});

test("my-work shell renders semantic regions and localized empty states", () => {
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(MyWorkShell, {
          onStartWorkflow: () => undefined,
          onRetry: () => undefined,
          showWorkflowCreation: true,
          startFeedbackByWorkflowId: {},
          startingWorkflowId: null,
          workflowCreationHref: "/my-work/workflows/new",
          snapshot: {
            status: "success",
            data: {
              myProcesses: { items: [], limit: 12, hasMore: false },
              myTasks: { items: [], limit: 12, hasMore: false },
              startWorkflows: { items: [], limit: 6, hasMore: false }
            },
            updatedAt: Date.now()
          }
        })
      }
    )
  );

  assert.match(markup, /Mi trabajo/);
  assert.match(markup, /Mis tareas/);
  assert.match(markup, /Iniciar un proceso/);
  assert.match(markup, /Mis procesos/);
  assert.match(markup, /Crear flujo/);
  assert.match(markup, /No tienes tareas autorizadas para atender ahora/);
});

test("my-work shell renders startable workflow cards with the start action and feedback", () => {
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(MyWorkShell, {
          onStartWorkflow: () => undefined,
          onRetry: () => undefined,
          showWorkflowCreation: false,
          startFeedbackByWorkflowId: {
            "workflow-1": "Abriremos la primera tarea autorizada."
          },
          startingWorkflowId: "workflow-1",
          snapshot: {
            status: "success",
            data: {
              myProcesses: { items: [], limit: 12, hasMore: false },
              myTasks: { items: [], limit: 12, hasMore: false },
              startWorkflows: {
                items: [
                  {
                    workflowId: "workflow-1",
                    title: "Aprobaciones",
                    description: "",
                    availability: "Disponible para miembros activos de tu organizacion.",
                    versionNumber: 3
                  }
                ],
                limit: 6,
                hasMore: false
              }
            },
            updatedAt: Date.now()
          },
          workflowCreationHref: null
        })
      }
    )
  );

  assert.match(markup, /Aprobaciones/);
  assert.match(markup, /Version 3/);
  assert.match(markup, /Iniciando/);
  assert.match(markup, /Abriremos la primera tarea autorizada/);
});
