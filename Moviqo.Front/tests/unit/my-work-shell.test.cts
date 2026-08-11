import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  protectedEntryPath,
  resolveProtectedRedirectPath
} from "../../src/features/authentication";
import {
  buildMyWorkDashboardQuery,
  MyWorkShell,
  defaultMyProcessesQuery
} from "../../src/features/my-work";
import { resolveProcessDetailPageView } from "../../src/pages/process-detail/ui/ProcessDetailPage";
import type { NormalizedApiProblem, QuerySnapshot } from "../../src/shared/api";
import { LanguageProvider, memoryLanguagePreferenceAdapter } from "../../src/shared/localization";
import type { MyWorkDashboard } from "../../src/features/my-work";

const renderShell = (
  snapshot: QuerySnapshot<MyWorkDashboard, NormalizedApiProblem>,
  overrides: Record<string, unknown> = {}
) =>
  renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(MyWorkShell, {
          onStartWorkflow: () => undefined,
          onRetry: () => undefined,
          onMyProcessesPageChange: () => undefined,
          onMyTasksPageChange: () => undefined,
          onMyProcessesSearchChange: () => undefined,
          onMyProcessesSearchSubmit: () => undefined,
          onStartWorkflowsPageChange: () => undefined,
          showWorkflowCreation: false,
          startFeedbackByWorkflowId: {},
          startingWorkflowId: null,
          myProcessesQuery: defaultMyProcessesQuery,
          myProcessesSearchDraft: defaultMyProcessesQuery.search,
          myProcessesTimeZone: "America/Bogota",
          workflowCreationHref: null,
          snapshot,
          ...overrides
        })
      }
    )
  );

test("protected authentication entry path targets the my-work route", () => {
  assert.equal(protectedEntryPath, "/my-work");
  assert.equal(resolveProtectedRedirectPath("/my-work"), "/sign-in");
  assert.equal(resolveProtectedRedirectPath("/"), null);
});

test("my-work shell renders semantic regions and localized empty states", () => {
  const markup = renderShell(
    {
      status: "success",
      data: {
        myProcesses: { items: [], limit: 12, hasMore: false },
        myTasks: { items: [], limit: 12, hasMore: false },
        startWorkflows: { items: [], limit: 6, hasMore: false }
      },
      updatedAt: Date.now()
    },
    {
      showWorkflowCreation: true,
      workflowCreationHref: "/my-work/workflows/new"
    }
  );

  assert.match(markup, /Mi trabajo/);
  assert.match(markup, /Mis tareas/);
  assert.match(markup, /Iniciar un proceso/);
  assert.match(markup, /Mis procesos/);
  assert.match(markup, /Crear flujo/);
  assert.match(markup, /No tienes tareas autorizadas para atender ahora/);
  assert.match(markup, /Buscar procesos completados/);
});

test("my-work pagination uses the generated endpoint query contract", () => {
  assert.deepEqual(buildMyWorkDashboardQuery({
    myTasksPage: 2,
    page: 3,
    search: "  approvals  ",
    startWorkflowsPage: 4
  }), {
    myProcessesPage: 3,
    myProcessesSearch: "approvals",
    myTasksPage: 2,
    startWorkflowsPage: 4
  });
});

test("dedicated my-work modules retain an accessible region name", () => {
  const markup = renderShell(
    {
      status: "success",
      data: {
        myProcesses: { items: [], limit: 12, hasMore: false },
        myTasks: { items: [], limit: 12, hasMore: false },
        startWorkflows: { items: [], limit: 6, hasMore: false }
      },
      updatedAt: Date.now()
    },
    { regions: ["myTasks"], showHeading: false, showRegionNavigation: false }
  );

  assert.match(markup, /<section class="my-work-shell" aria-label="Mis tareas">/);
  assert.doesNotMatch(markup, /aria-labelledby="my-work-title"/);
});

test("my-work shell keeps permission denial localized and exposes only the safe code", () => {
  const markup = renderShell({
    status: "error",
    error: {
      type: "https://api.moviqo.local/problems/permission-denied",
      title: "Restricted process exists",
      status: 403,
      code: "permission_denied",
      correlationId: "safe-correlation-123",
      invalidParams: []
    },
    updatedAt: Date.now()
  });

  assert.match(markup, /No tienes permiso para ver este trabajo/);
  assert.match(markup, /data-error-code="permission_denied"/);
  assert.doesNotMatch(markup, /Restricted process exists/);
});

test("my-work shell renders startable workflow cards with the start action and feedback", () => {
  const markup = renderShell({
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
  }, {
    startFeedbackByWorkflowId: {
      "workflow-1": "Abriremos la primera tarea autorizada."
    },
    startingWorkflowId: "workflow-1"
  });

  assert.match(markup, /Aprobaciones/);
  assert.match(markup, /Version 3/);
  assert.match(markup, /Iniciando/);
  assert.match(markup, /Abriremos la primera tarea autorizada/);
});

test("my-work shell renders assigned task cards with one open-task action", () => {
  const markup = renderShell({
    status: "success",
    data: {
      myProcesses: { items: [], limit: 12, hasMore: false },
      myTasks: {
        items: [
          {
            taskId: "task-1",
            title: "Revisar solicitud",
            workflowName: "Aprobaciones",
            status: "assigned",
            processId: "process-1",
            activatedAt: "2026-08-05T00:00:00+00:00",
            openTaskRoute: "/my-work/tasks/task-1"
          }
        ],
        limit: 12,
        hasMore: false
      },
      startWorkflows: { items: [], limit: 6, hasMore: false }
    },
    updatedAt: Date.now()
  });

  assert.match(markup, /Revisar solicitud/);
  assert.match(markup, /Estado: Asignada/);
  assert.match(markup, /Proceso: process-/);
  assert.match(markup, /Abrir tarea/);
  assert.match(markup, /href="\/my-work\/tasks\/task-1"/);
});

test("my-work shell renders completed process cards with discovery controls", () => {
  const markup = renderShell({
    status: "success",
    data: {
      myProcesses: {
        items: [
          {
            processId: "process-1",
            processNumber: "process-",
            workflowName: "Aprobaciones",
            workflowVersionNumber: 1,
            involvement: "Initiator",
            currentStep: "End",
            systemStatus: "completed",
            startedAt: "2026-08-05T00:00:00+00:00",
            completedAt: "2026-08-05T01:00:00+00:00",
            lastActivityAt: "2026-08-05T01:00:00+00:00",
            viewRoute: "/my-work/processes/process-1",
            contributionSummary: {
              kind: "initiated",
              label: "You started this process."
            }
          }
        ],
        limit: 12,
        hasMore: false
      },
      myTasks: { items: [], limit: 12, hasMore: false },
      startWorkflows: { items: [], limit: 6, hasMore: false }
    },
    updatedAt: Date.now()
  }, {
    myProcessesQuery: {
      ...defaultMyProcessesQuery,
      page: 2,
      search: "apro"
    }
  });

  assert.match(markup, /Aprobaciones/);
  assert.match(markup, /Proceso: process-/);
  assert.match(markup, /Paso actual: End/);
  assert.match(markup, /Ver proceso/);
  assert.match(markup, /Pagina anterior/);
  assert.match(markup, /Pagina siguiente/);
  assert.match(markup, /href="\/my-work\/processes\/process-1"/);
});

test("process detail page view resolves loading, error, and ready states", () => {
  assert.equal(resolveProcessDetailPageView("loading", null), "loading");
  assert.equal(resolveProcessDetailPageView("error", null), "error");
  assert.equal(
    resolveProcessDetailPageView("ready", {
      header: {
        processId: "process-1",
        processNumber: "process-",
        workflowName: "Aprobaciones",
        workflowVersionNumber: 1,
        systemStatus: "completed",
        currentStep: "End",
        startedAt: "2026-08-05T00:00:00+00:00",
        completedAt: "2026-08-05T01:00:00+00:00",
        lastActivityAt: "2026-08-05T01:00:00+00:00",
        contributionSummary: {
          kind: "initiated",
          label: "You started this process."
        }
      },
      timeline: []
    }),
    "ready"
  );
});
