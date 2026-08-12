import { expect, test } from "@playwright/test";
import { mockCsrfBootstrap } from "./support/mockCsrf";

const workflowId = "01987df4-ae8a-7000-8000-000000000210";
const organizationId = "018f6d8c-6a58-7000-8000-000000000002";
const membershipId = "018f6d8c-6a58-7000-8000-000000000001";

const authenticatedSession = {
  authenticated: true,
  user: { id: 1, displayName: "Ana", preferredLanguage: "es" },
  membership: {
    id: membershipId,
    organizationId,
    organizationTimezone: "America/Bogota",
    role: "owner"
  }
};

const createAcceptedWorkflow = (revision: string, draft: Record<string, unknown>) => ({
  workflowId,
  organizationId,
  createdByMembershipId: membershipId,
  configurationDirectory: { memberships: [], teams: [] },
  name: "Ruta de aprobacion",
  revision,
  draft
});

test("workflow editor adds with pointer and keyboard, explicitly saves, reloads, validates, and publishes", async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  let savedDraft: Record<string, unknown> = {
    schemaVersion: 5,
    draftId: "01987df4-ae8a-7000-8000-000000000211",
    workflowId,
    name: "Ruta de aprobacion",
    status: "draft",
    elements: [{ id: "start-1", type: "start", label: "Start" }],
    connections: [],
    processFields: [],
    formBindings: []
  };
  let revision = "1";
  let saveBody: Record<string, unknown> | null = null;
  let validationBody: Record<string, unknown> | null = null;
  let publishBody: Record<string, unknown> | null = null;

  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authenticatedSession)
    });
  });
  await page.route(`**/api/v1/workflow-design/workflows/${workflowId}/draft/`, async (route) => {
    if (route.request().method() === "PUT") {
      saveBody = route.request().postDataJSON() as Record<string, unknown>;
      savedDraft = saveBody.draft as Record<string, unknown>;
      revision = "2";
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createAcceptedWorkflow(revision, savedDraft))
    });
  });
  await page.route(
    `**/api/v1/workflow-design/workflows/${workflowId}/publication-validation/`,
    async (route) => {
      validationBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ workflowId, revision, publishable: true, issues: [] })
      });
    }
  );
  await page.route(`**/api/v1/workflow-design/workflows/${workflowId}/publish/`, async (route) => {
    publishBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...createAcceptedWorkflow(revision, savedDraft),
        publishedVersion: {
          versionNumber: 1,
          publishedAt: "2026-08-11T12:00:00Z",
          sourceRevision: revision,
          schemaVersion: 5
        }
      })
    });
  });

  await page.goto(`/workflows/${workflowId}/design`);
  await expect(page.getByRole("heading", { level: 1, name: /Inicio, Tarea y Fin/ })).toBeVisible();

  await expect(page.getByRole("button", { name: "Agregar Inicio" })).toHaveCount(0);
  await page.getByRole("button", { name: "Agregar Tarea" }).click();
  await page.getByLabel("Nombre de la tarea").fill("   ");
  await expect(page.getByText("Escribe un nombre para la tarea antes de guardar.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeDisabled();
  expect(saveBody).toBeNull();
  await page.getByLabel("Nombre de la tarea").fill("Revisar solicitud");
  await page.getByRole("button", { name: "Agregar Fin" }).dragTo(page.locator(".react-flow"), {
    targetPosition: { x: 120, y: 260 }
  });

  await expect(page.getByRole("group", { name: "Inicio: Inicio" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Tarea: Revisar solicitud" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Fin: Fin" })).toBeVisible();

  await page.getByLabel("Origen").selectOption("start-1");
  await page.getByLabel("Destino").selectOption("task-1");
  await page.getByRole("button", { name: "Conectar", exact: true }).click();
  await page.locator("#workflow-element-task-1 .react-flow__handle-right").dragTo(
    page.locator("#workflow-element-end-1 .react-flow__handle-left")
  );
  await page.getByLabel("Etiqueta de la conexión").fill("Solicitud revisada");

  await page.keyboard.press("Control+S");
  await expect(page.getByText(/2/).filter({ hasText: /Revisi/ })).toBeVisible();
  expect(saveBody).toMatchObject({ expectedRevision: "1" });
  expect(Object.keys(saveBody ?? {}).sort()).toEqual(["draft", "expectedRevision"]);
  const savedDocument = saveBody?.draft as {
    elements: Array<Record<string, unknown>>;
    connections: Array<Record<string, unknown>>;
  };
  expect(savedDocument.elements.find((element) => element.id === "task-1")).toMatchObject({
    id: "task-1",
    label: "Revisar solicitud"
  });
  expect(savedDocument.connections.find(
    (connection) => connection.sourceId === "task-1"
  )).toMatchObject({
    sourceId: "task-1",
    targetId: "end-1",
    label: "Solicitud revisada"
  });

  await page.reload();
  const taskNode = page.getByRole("group", { name: "Tarea: Revisar solicitud" });
  await expect(taskNode).toBeVisible();
  await taskNode.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Nombre de la tarea")).toHaveValue("Revisar solicitud");
  const positionBefore = await taskNode.boundingBox();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await taskNode.boundingBox())?.x).toBeGreaterThan(positionBefore?.x ?? 0);
  await expect(page.getByText("Solicitud revisada", { exact: true })).toBeVisible();
  const labeledEdge = page.locator('.react-flow__edge[data-id="connection-2"]');
  await labeledEdge.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Etiqueta de la conexión")).toHaveValue("Solicitud revisada");
  await page.getByRole("button", { name: /Validar publicaci/ }).click();
  await expect(page.getByText(/listo para publicar/)).toBeVisible();
  expect(validationBody).toEqual({ expectedRevision: "2" });

  await page.getByRole("button", { name: /Publicar versi/ }).click();
  await expect(page.getByText(/versi.n publicada.*Versi.n 1/i)).toBeVisible();
  expect(publishBody).toEqual({ expectedRevision: "2" });
});
