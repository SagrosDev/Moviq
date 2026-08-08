import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { mockCsrfBootstrap } from "./support/mockCsrf";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

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
  myProcesses: { items: [], limit: 12, hasMore: false },
  myTasks: { items: [], limit: 12, hasMore: false },
  startWorkflows: { items: [], limit: 6, hasMore: false }
};

test("authenticated my-work exposes semantic regions, empty states, and keyboard-safe navigation", async ({
  browserName,
  page
}) => {
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authenticatedSession) });
  });
  await page.route("**/api/v1/my-work/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(emptyDashboard) });
  });

  await page.goto("/my-work");

  await expect(page.getByRole("heading", { name: "Mi trabajo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mis tareas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Iniciar un proceso" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mis procesos" })).toBeVisible();
  await expect(page.getByText("No tienes tareas autorizadas para atender ahora.")).toBeVisible();
  await expect(page.getByText("No hay procesos autorizados para iniciar ahora.")).toBeVisible();
  await expect(page.getByText("No tienes procesos autorizados para seguir ahora.")).toBeVisible();

  if (browserName === "webkit") {
    await page.getByRole("link", { name: "Mi trabajo" }).focus();
  } else {
    await page.keyboard.press("Tab");
  }
  await expect(page.getByRole("link", { name: "Mi trabajo" })).toBeFocused();
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

    if (myWorkCallCount === 1) {
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

    if (myWorkCallCount === 2) {
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
  await page.goto("/my-work");
  await expect(page.getByText("Cargando tu trabajo autorizado.").first()).toBeVisible();
  await expect(page.getByRole("alert").getByText("No pudimos cargar tu trabajo autorizado. Intenta de nuevo.").first()).toBeVisible();
  await page.getByRole("button", { name: "Reintentar" }).first().click();

  await expect(page.getByRole("heading", { name: "Mi trabajo" })).toBeVisible();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

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

  await page.reload();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Ingresa a Moviqo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mi trabajo" })).toHaveCount(0);
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
    myProcesses: { items: [], limit: 12, hasMore: false },
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
      hasMore: false
    },
    startWorkflows: { items: [], limit: 6, hasMore: false }
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

  await page.goto("/my-work");
  await page.getByRole("link", { name: "Abrir tarea" }).click();

  await expect(page).toHaveURL(new RegExp(`/my-work/tasks/${taskDocument.taskId}$`));
  await expect(page.getByRole("heading", { name: "Revisar solicitud" })).toBeVisible();
  await expect(page.getByText("Proceso: 01987df4")).toBeVisible();

  await page.getByRole("textbox", { name: "Nombre del solicitante" }).fill("Ana Perez");
  await page.getByRole("button", { name: "Guardar borrador" }).click();

  await expect.poll(() => saveRequestSeen).toBe(true);
  await expect(page.getByText("El servidor guardo el avance autorizado.")).toBeVisible();
  expect(saveRequestSeen).toBe(true);
  await expect(page.getByRole("textbox", { name: "Nombre del solicitante" })).toHaveValue("Ana Perez");
});
