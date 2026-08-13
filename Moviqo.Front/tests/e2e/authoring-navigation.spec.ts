import { expect, test } from "@playwright/test";
import { mockCsrfBootstrap } from "./support/mockCsrf";

const workflowId = "01987df4-ae8a-7000-8000-000000000110";
const organizationId = "018f6d8c-6a58-7000-8000-000000000002";
const taskElementId = "task-1";

const authenticatedSession = {
  authenticated: true,
  user: { id: 1, displayName: "Ana", preferredLanguage: "es" },
  membership: {
    id: "018f6d8c-6a58-7000-8000-000000000001",
    organizationId,
    organizationTimezone: "America/Bogota",
    role: "owner"
  }
};

const acceptedWorkflow = {
  workflowId,
  organizationId,
  createdByMembershipId: authenticatedSession.membership.id,
  configurationDirectory: { memberships: [], teams: [] },
  name: "Aprobaciones",
  revision: "1",
  draft: {
    schemaVersion: 5,
    draftId: "01987df4-ae8a-7000-8000-000000000111",
    workflowId,
    name: "Aprobaciones",
    status: "draft",
    elements: [
      { id: "start-1", type: "start", label: "Inicio" },
      { id: taskElementId, type: "task", label: "Revisar solicitud" },
      { id: "end-1", type: "end", label: "Fin" }
    ],
    connections: [
      { id: "connection-1", type: "sequence", sourceId: "start-1", targetId: taskElementId },
      { id: "connection-2", type: "sequence", sourceId: taskElementId, targetId: "end-1" }
    ],
    processFields: [],
    formBindings: []
  }
};

test("workflow creation, dirty navigation, form launch, and deep-link reload stay canonical", async ({ page }) => {
  let draftReads = 0;
  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authenticatedSession)
    });
  });
  await page.route("**/api/v1/workflow-design/workflows/", async (route, request) => {
    if (request.method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(acceptedWorkflow)
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [{
          workflowId,
          name: acceptedWorkflow.name,
          revision: acceptedWorkflow.revision,
          schemaVersion: acceptedWorkflow.draft.schemaVersion,
          updatedAt: "2026-08-11T00:00:00Z"
        }]
      })
    });
  });
  await page.route("**/api/v1/workflow-design/workflows/*/draft/", async (route) => {
    if (!route.request().url().includes(workflowId)) {
      await route.fulfill({
        status: 404,
        contentType: "application/problem+json",
        body: JSON.stringify({
          type: "https://api.moviqo.local/problems/resource-not-found",
          title: "Not found",
          status: 404,
          code: "resource_not_found",
          correlationId: "authoring-error-state-123"
        })
      });
      return;
    }
    draftReads += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(acceptedWorkflow)
    });
  });
  await page.route("**/api/v1/workflow-design/workflows/*/tasks/*/form-authoring-lease/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        workflowId,
        taskElementId,
        mode: "editable",
        leaseToken: "01987df4-ae8a-7000-8000-000000000119",
        leaseExpiresAt: "2026-08-13T12:01:00Z",
        heartbeatAfterSeconds: 20,
        holder: {
          membershipId: authenticatedSession.membership.id,
          displayName: authenticatedSession.user.displayName,
        },
      }),
    });
  });

  await page.goto("/workflows");
  await expect(page.getByRole("heading", { level: 1, name: "Flujos" })).toBeVisible();
  await page.getByRole("button", { name: "Crear flujo" }).click();
  await expect(page).toHaveURL(/\/workflows\/new$/);
  await page.getByLabel("Nombre del flujo").fill(acceptedWorkflow.name);
  await page.getByRole("button", { name: "Crear flujo" }).click();

  await expect(page).toHaveURL(new RegExp(`/workflows/${workflowId}/design$`));
  await expect(page.getByRole("heading", { level: 2, name: "Diseña tu flujo de trabajo" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: acceptedWorkflow.name })).toBeVisible();
  await expect(page.getByLabel("Nombre del flujo")).toHaveCount(0);

  await page.getByRole("group", { name: /Tarea: Revisar solicitud/ }).click();
  await page.getByRole("button", { name: "Diseñar formulario" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/workflows/${workflowId}/tasks/${taskElementId}/form$`)
  );
  await page.getByRole("link", { name: acceptedWorkflow.name }).click();
  await expect(page).toHaveURL(new RegExp(`/workflows/${workflowId}/design$`));

  await page.getByLabel("Quién puede iniciar").selectOption("allActiveMembers");
  await page.getByRole("group", { name: /Tarea: Revisar solicitud/ }).click();
  await page.getByRole("button", { name: "Diseñar formulario" }).click();
  await expect(page.getByText("Hay cambios sin guardar")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar y diseñar formulario" })).toBeVisible();
  await page.getByRole("button", { name: "Permanecer" }).click();
  await expect(page).toHaveURL(new RegExp(`/workflows/${workflowId}/design$`));

  await page.getByRole("link", { name: "Formularios", exact: true }).click();
  await expect(page.getByText("Hay cambios sin guardar")).toBeVisible();
  await page.getByRole("button", { name: "Permanecer" }).click();
  await expect(page).toHaveURL(new RegExp(`/workflows/${workflowId}/design$`));

  await page.getByRole("link", { name: "Formularios", exact: true }).click();
  await page.getByRole("button", { name: "Descartar y salir" }).click();
  await expect(page).toHaveURL(/\/forms$/);

  await page.getByLabel("Flujo", { exact: true }).selectOption(workflowId);
  await page.getByLabel("Tarea").selectOption(taskElementId);
  await page.getByRole("button", { name: "Diseñar formulario" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/workflows/${workflowId}/tasks/${taskElementId}/form$`)
  );
  await expect(page.getByRole("heading", { level: 1, name: "Diseñador de formulario" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Campos" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Lienzo del formulario" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Propiedades" })).toBeVisible();
  await expect(page.getByText("Borrador guardado")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Diseñador de formulario" })).toBeVisible();
  expect(draftReads).toBeGreaterThanOrEqual(1);

  await page.goto("/workflows/01987df4-ae8a-7000-8000-000000000999/design");
  await expect(page.getByRole("alert")).toContainText(/No encontramos este borrador/i);
  await expect(page.getByRole("button", { name: "Volver a flujos" })).toBeVisible();
});

test("empty authoring pages guide an owner to create the first workflow", async ({ page }) => {
  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authenticatedSession)
    });
  });
  await page.route("**/api/v1/workflow-design/workflows/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] })
    });
  });

  await page.goto("/forms");
  await expect(page.getByRole("heading", { level: 2, name: "Aún no tienes formularios" })).toBeVisible();
  await expect(page.locator("ol").getByRole("listitem")).toHaveText([
    "Crea un flujo de proceso y agrega al menos una tarea.",
    "Vuelve a Formularios para diseñar los campos de esa tarea."
  ]);
  await page.getByRole("button", { name: "Crear flujo" }).click();
  await expect(page).toHaveURL(/\/workflows\/new$/);

  await page.goto("/workflows");
  await expect(page.getByRole("heading", { level: 2, name: "Crea tu primer flujo" })).toBeVisible();
  await expect(page.getByText(/Aún no tienes flujos/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear flujo" })).toBeVisible();
});
