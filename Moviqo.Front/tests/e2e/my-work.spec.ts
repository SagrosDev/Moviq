import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { mockCsrfBootstrap } from "./support/mockCsrf";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

const expectNoAccessibilityViolations = async (page: Page) => {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import("axe-core") }).axe;
    return axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
      }
    });
  });
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
};

const authenticatedSession = {
  authenticated: true,
  user: { id: 1, displayName: "Ana", preferredLanguage: "es" },
  membership: {
    id: "018f6d8c-6a58-7000-8000-000000000001",
    organizationId: "018f6d8c-6a58-7000-8000-000000000002",
    organizationTimezone: "America/Bogota",
    role: "owner"
  }
};

const emptyDashboard = {
  myProcesses: { items: [], limit: 12, hasMore: false, page: 1, totalItems: 0, totalPages: 1 },
  myTasks: { items: [], limit: 12, hasMore: false, page: 1, totalItems: 0, totalPages: 1 },
  startWorkflows: { items: [], limit: 6, hasMore: false, page: 1, totalItems: 0, totalPages: 1 }
};

test("Mi trabajo opens Tasks directly and switches to Processes while Start Process stays separate", async ({
  browserName,
  page
}) => {
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authenticatedSession) });
  });
  await page.route(/\/api\/v1\/my-work\/(?:\?.*)?$/, async (route) => {
    const taskSearch = new URL(route.request().url()).searchParams.get("myTasksSearch");
    const dashboard = taskSearch === "revisar"
      ? {
          ...emptyDashboard,
          myTasks: {
            items: [{
              taskId: "01987df4-ae8a-7000-8000-000000000301",
              title: "Revisar solicitud",
              workflowName: "Aprobaciones",
              status: "assigned",
              processId: "01987df4-ae8a-7000-8000-000000000302",
              activatedAt: "2026-08-11T12:00:00Z",
              openTaskRoute: "/my-work/tasks/01987df4-ae8a-7000-8000-000000000301"
            }],
            limit: 12,
            hasMore: false,
            page: 1,
            totalItems: 1,
            totalPages: 1
          }
        }
      : emptyDashboard;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dashboard) });
  });

  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/my-work");

  await expect(page.getByRole("heading", { level: 1, name: "Mi trabajo" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Tareas y procesos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mis tareas", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 2, name: "Mis tareas" })).toBeVisible();
  await expect(page.locator("#main-content").getByRole("link", { name: "Iniciar proceso" })).toHaveCount(0);
  await expect(page.locator("[data-dashboard-summary]")).toHaveCount(0);
  await expect(page.getByText(/No tienes tareas pendientes/)).toBeVisible();
  await page.getByLabel("Buscar tareas").fill("revisar");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("rowheader", { name: "Revisar solicitud" })).toBeVisible();

  await page.getByRole("link", { name: "Mis procesos", exact: true }).click();
  await expect(page).toHaveURL(/\/my-work\/processes$/);
  await expect(page.getByRole("heading", { level: 1, name: "Mi trabajo" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Mis procesos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mis procesos", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/Aún no hay procesos relacionados contigo/)).toBeVisible();

  await page.getByRole("link", { name: "Mis tareas", exact: true }).click();
  await expect(page).toHaveURL(/\/my-work\/tasks$/);

  await page.getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Iniciar proceso", exact: true })
    .click();
  await expect(page).toHaveURL(/\/processes\/start$/);
  await expect(page.getByRole("heading", { level: 1, name: "Iniciar un proceso" })).toBeVisible();
  await expect(page.getByText("Crea un flujo para iniciar")).toBeVisible();
  await expect(page.getByRole("link", { name: "Crear flujo" })).toHaveAttribute("href", "/workflows/new");
  await expect(page.locator("#main-content")).toBeFocused();
  const workspaceWidth = await page.locator("#main-content > div").evaluate((element) => (
    element.getBoundingClientRect().width
  ));
  expect(workspaceWidth).toBeGreaterThan(1600);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Iniciar un proceso" })).toBeVisible();

  if (browserName === "webkit") {
    await page.getByRole("link", { name: "Saltar al contenido principal" }).focus();
  } else {
    await page.keyboard.press("Tab");
  }
  await expect(page.getByRole("link", { name: "Saltar al contenido principal" })).toBeFocused();
});

test("starting a process shows shared progress feedback and blocks competing start actions", async ({
  page
}) => {
  const workflowId = "01987df4-ae8a-7000-8000-000000000110";
  const taskId = "01987df4-ae8a-7000-8000-000000000301";
  let releaseStartRequest = () => undefined;
  const startRequestReleased = new Promise<void>((resolve) => {
    releaseStartRequest = resolve;
  });
  let startRequestCount = 0;

  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authenticatedSession) });
  });
  await page.route(/\/api\/v1\/my-work\/(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...emptyDashboard,
        startWorkflows: {
          items: [
            {
              workflowId,
              title: "Aprobación Cartas",
              description: "",
              availability: "Disponible para miembros activos de tu organización.",
              versionNumber: 1
            },
            {
              workflowId: "01987df4-ae8a-7000-8000-000000000111",
              title: "Revisión de contratos",
              description: "",
              availability: "Disponible para miembros activos de tu organización.",
              versionNumber: 1
            }
          ],
          limit: 6,
          hasMore: true,
          page: 1,
          totalItems: 7,
          totalPages: 2
        }
      })
    });
  });
  await page.route("**/api/v1/my-work/start-workflows/*/start/", async (route) => {
    startRequestCount += 1;
    await startRequestReleased;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        processId: "01987df4-ae8a-7000-8000-000000000210",
        taskId,
        workflow: {
          workflowId,
          title: "Aprobación Cartas",
          versionNumber: 1
        },
        destinationRoute: `/my-work/tasks/${taskId}`
      })
    });
  });

  await page.goto("/processes/start");
  const startRegion = page.locator("section[aria-labelledby='my-work-startWorkflows-title']");
  await startRegion.getByRole("button", { name: "Iniciar", exact: true }).first().click();

  await expect(startRegion.getByRole("status")).toContainText("Iniciando el proceso");
  await expect(startRegion.locator(".animate-spin")).toBeVisible();
  await expect(startRegion.getByRole("button")).toHaveCount(0);
  await expect(startRegion.getByRole("link")).toHaveCount(0);
  expect(startRequestCount).toBe(1);

  releaseStartRequest();
  await expect(page).toHaveURL(new RegExp(`/my-work/tasks/${taskId}$`));
  expect(startRequestCount).toBe(1);
});

test("work reports switch between semantic desktop tables and equivalent mobile cards", async ({
  page
}) => {
  const dashboard = {
    ...emptyDashboard,
    myTasks: {
      items: [{
        taskId: "01987df4-ae8a-7000-8000-000000000301",
        title: "Revisar solicitud",
        workflowName: "Aprobaciones",
        status: "assigned",
        processId: "01987df4-ae8a-7000-8000-000000000211",
        activatedAt: "2026-08-05T00:15:00Z",
        openTaskRoute: "/my-work/tasks/01987df4-ae8a-7000-8000-000000000301"
      }],
      limit: 12,
      hasMore: false,
      page: 1,
      totalItems: 1,
      totalPages: 1
    },
    myProcesses: {
      items: [
        {
          processId: "01987df4-ae8a-7000-8000-000000000211",
          processNumber: "01987df4",
          workflowName: "Aprobaciones",
          workflowVersionNumber: 1,
          involvement: "Initiator",
          currentStep: "Revisión",
          currentStepKind: "taskLabel",
          systemStatus: "active",
          startedAt: "2026-08-05T00:00:00Z",
          completedAt: null,
          lastActivityAt: "2026-08-05T01:00:00Z",
          viewRoute: "/my-work/processes/01987df4-ae8a-7000-8000-000000000211",
          contributionSummary: { kind: "initiated", label: "Iniciaste este proceso." }
        }
      ],
      limit: 12,
      hasMore: false,
      page: 1,
      totalItems: 1,
      totalPages: 1
    }
  };

  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authenticatedSession) });
  });
  await page.route("**/api/v1/my-work/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dashboard) });
  });
  await page.route("**/api/v1/my-work/processes/01987df4-ae8a-7000-8000-000000000211/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        header: {
          ...dashboard.myProcesses.items[0]
        },
        timeline: [{
          eventKind: "process_started",
          label: "Raw event label",
          actorDisplay: "Authorized member",
          actorDisplayKind: "member",
          taskPosition: "Start",
          taskPositionKind: "start",
          occurredAt: "2026-08-05T00:00:00Z"
        }]
      })
    });
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/my-work/tasks");
  await expect(page.getByRole("table", { name: "Mis tareas" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Tarea" })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Revisar solicitud" })).toBeVisible();
  await expect(page.locator("[data-task-layout='cards']")).toBeHidden();
  await expect(page.getByRole("region", { name: /Tabla de tareas/ })).toHaveAttribute("tabindex", "0");
  await expectNoAccessibilityViolations(page);

  await page.goto("/my-work/processes");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Revisión");
  await expect(page.getByRole("table")).toContainText("Activo");
  await expect(page.getByRole("columnheader", { name: "Flujo" })).toBeVisible();
  await expect(page.locator("[data-process-layout='cards']")).toBeHidden();
  await expect(page.getByRole("region", { name: /Tabla de procesos/ })).toHaveAttribute("tabindex", "0");
  await expectNoAccessibilityViolations(page);

  await page.getByRole("link", { name: /Ver proceso: Aprobaciones 01987df4/ }).click();
  await expect(page.getByText("Proceso activo", { exact: true })).toBeVisible();
  await expect(page.locator("#main-content span.inline-flex").filter({ hasText: "Activo" })).toBeVisible();
  await page.goto("/my-work/processes");

  await page.setViewportSize({ width: 900, height: 800 });
  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.locator("[data-process-layout='cards']")).toBeVisible();

  await page.goto("/my-work/tasks");
  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.locator("[data-task-layout='cards']")).toBeVisible();
  await expect(page.locator("[data-task-layout='cards']").getByRole("link", { name: /Abrir tarea/ })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.locator("[data-task-layout='cards']")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expectNoAccessibilityViolations(page);

  await page.goto("/my-work/processes");
  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.locator("[data-process-layout='cards']")).toBeVisible();
  await expect(page.locator("[data-process-layout='cards']").getByRole("link", {
    name: /Ver proceso: Aprobaciones 01987df4/
  })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expectNoAccessibilityViolations(page);
});

test("my-work shows loading, safe retry, mobile resilience, and revoked-session redirect", async ({
  page
}) => {
  let myWorkCallCount = 0;

  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authenticatedSession) });
  });
  await page.route("**/api/v1/my-work/", async (route) => {
    myWorkCallCount += 1;

    if (myWorkCallCount <= 3) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({ status: 500, contentType: "application/problem+json", body: JSON.stringify({
        type: "https://api.moviqo.local/problems/api-error",
        title: "Request failed",
        status: 500,
        code: "api_error",
        correlationId: "safe-correlation-123",
        invalidParams: []
      }) });
      return;
    }

    if (myWorkCallCount === 4) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(emptyDashboard) });
      return;
    }

    await route.fulfill({ status: 403, contentType: "application/problem+json", body: JSON.stringify({
      type: "https://api.moviqo.local/problems/authentication-failed",
      title: "Authentication failed",
      status: 403,
      code: "authentication_failed",
      correlationId: "safe-correlation-456",
      invalidParams: []
    }) });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/my-work/tasks");
  const loadingStatus = page.getByRole("status").filter({ hasText: "Cargando tus tareas asignadas." });
  await expect(loadingStatus).toBeVisible();
  const loadingSpinner = loadingStatus.locator("[aria-hidden='true']");
  await expect(loadingSpinner).toBeVisible();
  expect(await loadingSpinner.evaluate((element) => getComputedStyle(element).animationName)).toBe("moviqo-loading-pulse");
  await expect(page.getByRole("alert").getByText("Actualiza para cargar tus tareas.").first()).toBeVisible();
  await page.getByRole("button", { name: "Actualizar" }).first().click();

  await expect(page.getByRole("heading", { level: 1, name: "Mi trabajo" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Mis tareas" })).toBeVisible();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await expectNoAccessibilityViolations(page);

  await page.reload();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Ingresa a Moviqo" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Mi trabajo" })).toHaveCount(0);
});

test("task completion hands off directly to the authorized process timeline", async ({ page }) => {
  const taskId = "01987df4-ae8a-7000-8000-000000000411";
  const processId = "01987df4-ae8a-7000-8000-000000000412";
  const taskDocument = {
    taskId,
    processId,
    workflowId: "01987df4-ae8a-7000-8000-000000000410",
    workflowVersionId: "01987df4-ae8a-7000-8000-000000000413",
    workflowName: "Aprobaciones",
    taskTitle: "Revisar solicitud",
    taskElementId: "task-1",
    status: "assigned",
    taskRevision: "1",
    definitionRevision: "2",
    actions: { saveDraft: false, complete: true },
    form: { controls: [] }
  };
  const completion = {
    taskId,
    processId,
    workflowId: taskDocument.workflowId,
    workflowVersionId: taskDocument.workflowVersionId,
    workflowName: taskDocument.workflowName,
    taskTitle: taskDocument.taskTitle,
    taskStatus: "completed",
    processStatus: "completed",
    taskRevision: "2",
    definitionRevision: "2",
    routeTargetId: "end-1",
    completedAt: "2026-08-13T12:30:00Z",
    destinationRoute: `/my-work/processes/${processId}`,
    handoffMessage: "Raw server handoff must not render."
  };
  const processDetail = {
    header: {
      processId,
      processNumber: "MOV-0412",
      workflowName: "Aprobaciones",
      workflowVersionNumber: 1,
      systemStatus: "completed",
      currentStep: "End",
      currentStepKind: "end",
      startedAt: "2026-08-13T12:00:00Z",
      completedAt: "2026-08-13T12:30:00Z",
      lastActivityAt: "2026-08-13T12:30:00Z",
      contributionSummary: { kind: "initiated", label: "Iniciaste este proceso." }
    },
    timeline: [{
      eventKind: "process_completed",
      label: "Raw event label",
      actorDisplay: "Authorized member",
      actorDisplayKind: "member",
      taskPosition: "End",
      taskPositionKind: "end",
      occurredAt: "2026-08-13T12:30:00Z"
    }]
  };

  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authenticatedSession) });
  });
  let taskReadCount = 0;
  await page.route(`**/api/v1/my-work/tasks/${taskId}/form/`, async (route) => {
    taskReadCount += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(taskDocument) });
  });
  await page.route(`**/api/v1/my-work/tasks/${taskId}/complete/`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(completion) });
  });
  await page.route(`**/api/v1/my-work/processes/${processId}/`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(processDetail) });
  });

  await page.goto(`/my-work/tasks/${taskId}`);
  await page.getByRole("button", { name: "Completar tarea" }).click();
  await expect(page.getByText("La tarea quedó completa y el proceso llegó a su fin.")).toBeVisible();
  await expect(page.getByText("Raw server handoff must not render.")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/my-work/tasks/${taskId}$`));
  await page.reload();
  await expect(page.getByText("La tarea quedó completa y el proceso llegó a su fin.")).toBeVisible();
  expect(taskReadCount).toBe(1);
  await page.getByRole("link", { name: "Ver línea de tiempo" }).click();
  await expect(page).toHaveURL(new RegExp(`/my-work/processes/${processId}$`), { timeout: 5_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Aprobaciones" })).toBeVisible();
  const timeline = page.getByRole("region", { name: "Línea de tiempo" });
  await expect(timeline.getByText("Proceso completado")).toBeVisible();
  await expect(timeline.getByText("Persona")).toBeVisible();
  await expect(timeline.getByText("Authorized member")).toBeVisible();
  await expect(timeline.getByText("Fin")).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("assigned task opens from my-work and saves authorized progress without false success", async ({
  page
}) => {
  const taskDocument = {
    taskId: "01987df4-ae8a-7000-8000-000000000311",
    processId: "01987df4-ae8a-7000-8000-000000000211",
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    workflowName: "Aprobaciones",
    taskTitle: "Revisar solicitud",
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
          label: "Nombre del solicitante",
          helpText: "Usa el nombre completo.",
          placeholder: "Ejemplo: Ana Perez",
          width: "full",
          position: 0,
          value: ""
        }
      ]
    }
  };
  const savedDocument = {
    ...taskDocument,
    status: "in_progress",
    taskRevision: "2",
    form: {
      controls: [{ ...taskDocument.form.controls[0], value: "Ana Perez" }]
    }
  };
  const dashboard = {
    myProcesses: { items: [], limit: 12, hasMore: false, page: 1, totalItems: 0, totalPages: 1 },
    myTasks: {
      items: [
        {
          taskId: taskDocument.taskId,
          title: taskDocument.taskTitle,
          workflowName: taskDocument.workflowName,
          status: "assigned",
          processId: taskDocument.processId,
          activatedAt: "2026-08-05T00:00:00Z",
          openTaskRoute: `/my-work/tasks/${taskDocument.taskId}`
        }
      ],
      limit: 12,
      hasMore: false,
      page: 1,
      totalItems: 1,
      totalPages: 1
    },
    startWorkflows: { items: [], limit: 6, hasMore: false, page: 1, totalItems: 0, totalPages: 1 }
  };
  let saveRequestSeen = false;

  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authenticatedSession) });
  });
  await page.route("**/api/v1/my-work/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dashboard) });
  });
  await page.route(`**/api/v1/my-work/tasks/${taskDocument.taskId}/form/`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(taskDocument) });
      return;
    }

    saveRequestSeen = true;
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(savedDocument) });
  });

  await page.goto("/my-work/tasks");
  await page.getByRole("link", { name: "Abrir tarea" }).click();

  await expect(page).toHaveURL(new RegExp(`/my-work/tasks/${taskDocument.taskId}$`));
  await expect(page.getByRole("heading", { name: "Revisar solicitud" })).toBeVisible();
  await expect(page.locator("dt", { hasText: "Proceso:" }).locator("+ dd")).toHaveText("01987df4");

  await page.getByRole("textbox", { name: "Nombre del solicitante" }).fill("Ana Perez");
  await page.getByRole("button", { name: "Guardar borrador" }).click();

  await expect.poll(() => saveRequestSeen).toBe(true);
  await expect(page.getByText("El avance se guardó correctamente.")).toBeVisible();
  expect(saveRequestSeen).toBe(true);
  await expect(page.getByRole("textbox", { name: "Nombre del solicitante" })).toHaveValue("Ana Perez");

  await page.getByRole("textbox", { name: "Nombre del solicitante" }).fill("Ana Perez actualizada");
  await page.getByRole("link", { name: "Mis tareas" }).click();
  await expect(page.getByRole("alert")).toContainText("Hay cambios sin guardar");
  await page.getByRole("button", { name: "Permanecer" }).click();
  await expect(page).toHaveURL(new RegExp(`/my-work/tasks/${taskDocument.taskId}$`));
  await expect(page.getByRole("textbox", { name: "Nombre del solicitante" })).toHaveValue(
    "Ana Perez actualizada"
  );

  await page.getByRole("link", { name: "Mis tareas" }).click();
  await page.getByRole("button", { name: "Guardar y salir" }).click();
  await expect(page).toHaveURL(/\/my-work\/tasks$/);
});
