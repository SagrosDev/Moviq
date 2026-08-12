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

test("workflow editor saves optionally and publishes the current design directly", async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  let savedDraft: Record<string, unknown> = {
    schemaVersion: 7,
    draftId: "01987df4-ae8a-7000-8000-000000000211",
    workflowId,
    name: "Ruta de aprobacion",
    status: "draft",
    elements: [{ id: "start-1", type: "start", label: "Start" }],
    connections: [],
    processFields: [],
    formBindings: [],
    layout: { positions: { "start-1": { x: 80, y: 120 } } }
  };
  let revision = "1";
  let saveBody: Record<string, unknown> | null = null;
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
      revision = String(Number(revision) + 1);
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createAcceptedWorkflow(revision, savedDraft))
    });
  });
  await page.route(`**/api/v1/workflow-design/workflows/${workflowId}/publish/`, async (route) => {
    publishBody = route.request().postDataJSON() as Record<string, unknown>;
    savedDraft = publishBody.draft as Record<string, unknown>;
    revision = String(Number(revision) + 1);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...createAcceptedWorkflow(revision, savedDraft),
        publishedVersion: {
          versionNumber: 1,
          publishedAt: "2026-08-11T12:00:00Z",
          sourceRevision: revision,
          schemaVersion: 7
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
  await page.getByLabel("Quién recibe esta tarea").selectOption("workflowInitiator");
  await page.getByLabel("Quién puede iniciar").selectOption("allActiveMembers");
  await page.getByRole("button", { name: "Agregar Fin" }).dragTo(page.locator(".react-flow"), {
    targetPosition: { x: 120, y: 260 }
  });

  await expect(page.getByRole("group", { name: "Inicio: Inicio" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Tarea: Revisar solicitud" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Fin: Fin" })).toBeVisible();

  await page.locator("#workflow-element-start-1 .react-flow__handle-right").focus();
  await page.keyboard.press("Enter");
  await page.locator("#workflow-element-task-1 .react-flow__handle-left").focus();
  await page.keyboard.press("Enter");
  const pointerSource = page.locator("#workflow-element-task-1 .react-flow__handle-right");
  const pointerTarget = page.locator("#workflow-element-end-1 .react-flow__handle-left");
  const pointerSourceBox = await pointerSource.boundingBox();
  const pointerTargetBox = await pointerTarget.boundingBox();
  if (!pointerSourceBox || !pointerTargetBox) {
    throw new Error("Workflow connection handles were not measurable.");
  }
  await page.mouse.move(
    pointerSourceBox.x + pointerSourceBox.width / 2,
    pointerSourceBox.y + pointerSourceBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    pointerTargetBox.x + pointerTargetBox.width / 2,
    pointerTargetBox.y + pointerTargetBox.height / 2,
    { steps: 10 }
  );
  await page.mouse.up();
  const connectionLabel = page.getByLabel("Etiqueta de la conexión");
  await expect(connectionLabel).toBeVisible();
  await connectionLabel.fill("Solicitud revisada");

  const taskNodeBeforeSave = page.getByRole("group", { name: "Tarea: Revisar solicitud" });
  const taskBox = await taskNodeBeforeSave.boundingBox();
  if (!taskBox) throw new Error("Task node was not measurable before dragging.");
  await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    taskBox.x + taskBox.width / 2 + 30,
    taskBox.y + taskBox.height / 2 + 20,
    { steps: 5 }
  );
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeEnabled();
  await taskNodeBeforeSave.focus();
  await page.keyboard.press("ArrowDown");
  const taskTransformBeforeSave = await taskNodeBeforeSave.evaluate(
    (node) => (node as HTMLElement).style.transform
  );
  const endNodeBeforeSave = page.getByRole("group", { name: "Fin: Fin" });
  const endTransformBeforeSave = await endNodeBeforeSave.evaluate(
    (node) => (node as HTMLElement).style.transform
  );

  await page.keyboard.press("Control+S");
  await expect(page.getByText(/2/).filter({ hasText: /Revisi/ })).toBeVisible();
  expect(saveBody).toMatchObject({ expectedRevision: "1" });
  expect(Object.keys(saveBody ?? {}).sort()).toEqual(["draft", "expectedRevision"]);
  const savedDocument = saveBody?.draft as {
    elements: Array<Record<string, unknown>>;
    connections: Array<Record<string, unknown>>;
    layout: { positions: Record<string, { x: number; y: number }> };
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
  expect(savedDocument.layout.positions["task-1"]).toBeDefined();
  expect(savedDocument.layout.positions["end-1"]).toBeDefined();

  await page.reload();
  const taskNode = page.getByRole("group", { name: "Tarea: Revisar solicitud" });
  await expect(taskNode).toBeVisible();
  const taskVisual = page.locator("#workflow-element-task-1");
  const startVisual = page.locator("#workflow-element-start-1");
  const endVisual = page.locator("#workflow-element-end-1");
  await expect(taskVisual).toHaveCSS("font-size", "12px");
  await expect(taskVisual).toHaveCSS("min-width", "104px");
  await expect(taskVisual).toHaveCSS("min-height", "40px");
  await expect(startVisual).toHaveCSS("width", "48px");
  await expect(startVisual).toHaveCSS("height", "48px");
  await expect(endVisual).toHaveCSS("width", "48px");
  await expect(endVisual).toHaveCSS("height", "48px");
  expect(await taskNode.evaluate((node) => (node as HTMLElement).style.transform))
    .toBe(taskTransformBeforeSave);
  expect(await page.getByRole("group", { name: "Fin: Fin" }).evaluate(
    (node) => (node as HTMLElement).style.transform
  )).toBe(endTransformBeforeSave);
  const handle = page.locator("#workflow-element-task-1 .react-flow__handle-right");
  await expect(handle).toHaveCSS("width", "44px");
  await expect(handle).toHaveCSS("height", "44px");
  expect(await handle.evaluate((node) => getComputedStyle(node, "::before").width)).toBe("8px");
  await expect(page.locator(".react-flow").locator("..")).toHaveCSS("height", "640px");
  await expect(page.locator(".react-flow__arrowhead")).toHaveCount(1);
  await expect(page.getByText("Conexión de secuencia", { exact: true })).toHaveCount(0);
  await taskNode.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Nombre de la tarea")).toHaveValue("Revisar solicitud");
  const taskPositionBefore = savedDocument.layout.positions["task-1"];
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeEnabled();
  await page.keyboard.press("Control+S");
  const keyboardSavedDocument = saveBody?.draft as {
    layout: { positions: Record<string, { x: number; y: number }> };
  };
  expect(keyboardSavedDocument.layout.positions["task-1"]?.x)
    .toBe((taskPositionBefore?.x ?? 0) + 5);
  await expect(page.getByText("Solicitud revisada", { exact: true })).toBeVisible();
  const labeledEdge = page.locator('.react-flow__edge[data-id="connection-2"]');
  await labeledEdge.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Etiqueta de la conexión")).toHaveValue("Solicitud revisada");
  await page.getByLabel("Etiqueta de la conexión").fill("Solicitud lista para publicar");
  await expect(page.getByRole("button", { name: /Validar publicaci/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Publicar versi/ }).click();
  await expect(page.getByText(/versi.n publicada.*Versi.n 1/i)).toBeVisible();
  expect(publishBody).toMatchObject({ expectedRevision: "3" });
  expect((publishBody?.draft as { connections: Array<{ label?: string }> }).connections[1]?.label)
    .toBe("Solicitud lista para publicar");
});
