import { expect, test } from "@playwright/test";
import { mockCsrfBootstrap } from "./support/mockCsrf";

const workflowId = "01987df4-ae8a-7000-8000-000000000210";
const organizationId = "018f6d8c-6a58-7000-8000-000000000002";
const membershipId = "018f6d8c-6a58-7000-8000-000000000001";
const configurationDirectory = {
  memberships: [{
    membershipId,
    displayName: "Local Owner",
    email: "owner@local.test",
    role: "owner"
  }, {
    membershipId: "018f6d8c-6a58-7000-8000-000000000009",
    displayName: "DUPLICATE@LOCAL.TEST",
    email: "duplicate@local.test",
    role: "member"
  }],
  teams: []
};

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
  configurationDirectory,
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
  const taskAssignment = page.getByLabel("Quién recibe esta tarea");
  await expect(page.getByText("Quién recibe esta tarea", { exact: true })).toHaveCSS("font-weight", "700");
  await taskAssignment.selectOption("specificMember");
  const specificAssignee = page.getByLabel("Una persona específica");
  await expect(specificAssignee.locator("option", { hasText: "Local Owner (owner@local.test)" }))
    .toHaveAttribute("value", membershipId);
  await expect(specificAssignee.locator("option", { hasText: "duplicate@local.test" }))
    .toHaveText("duplicate@local.test");
  await expect(specificAssignee.locator("option", { hasText: "DUPLICATE@LOCAL.TEST (" }))
    .toHaveCount(0);
  await specificAssignee.selectOption(membershipId);
  const properties = page.getByRole("region", { name: "Propiedades" });
  await expect(properties.getByText("Tarea", { exact: true })).toHaveCount(0);
  await page.getByLabel("Quién puede iniciar").selectOption("allActiveMembers");
  await page.getByRole("button", { name: "Agregar Fin" }).dragTo(page.locator(".react-flow"), {
    targetPosition: { x: 120, y: 260 }
  });

  await expect(page.getByRole("group", { name: "Inicio: Inicio" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Tarea: Revisar solicitud" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Fin: Fin" })).toBeVisible();

  await page.locator("#workflow-element-start-1 .moviqo-workflow-handle.react-flow__handle-right").focus();
  await page.keyboard.press("Enter");
  await page.locator("#workflow-element-task-1 .moviqo-workflow-handle.react-flow__handle-left").focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const pointerSource = page.locator("#workflow-element-task-1 .moviqo-workflow-handle.react-flow__handle-right");
  const pointerTarget = page.locator("#workflow-element-end-1 .moviqo-workflow-handle.react-flow__handle-left");
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
  await page.waitForTimeout(100);
  await page.mouse.up();
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
  await expect(page.getByText("Revisar solicitud → Fin", { exact: true })).toBeVisible();
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
    label: "Revisar solicitud",
    assignment: { mode: "specificMember", membershipId }
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
  const handle = page.locator("#workflow-element-task-1 .moviqo-workflow-handle.react-flow__handle-right");
  await expect(handle).toHaveCSS("width", "44px");
  await expect(handle).toHaveCSS("height", "44px");
  expect(await handle.evaluate((node) => getComputedStyle(node, "::before").width)).toBe("8px");
  expect(await handle.evaluate((node) => getComputedStyle(node, "::before").height)).toBe("8px");
  const canvasHost = page.locator(".react-flow").locator("..");
  expect((await canvasHost.boundingBox())?.height).toBeGreaterThanOrEqual(640);
  const canvasShell = page.locator(".workflow-canvas-shell");
  const editorColumn = canvasShell.locator("xpath=preceding-sibling::div[1]");
  const canvasShellBox = await canvasShell.boundingBox();
  const editorColumnBox = await editorColumn.boundingBox();
  if (!canvasShellBox || !editorColumnBox) {
    throw new Error("Workflow editor columns were not measurable.");
  }
  expect(canvasShellBox?.height).toBe(editorColumnBox?.height);
  await expect(page.locator(".react-flow__arrowhead")).toHaveCount(1);
  await expect(page.getByText("Conexión de secuencia", { exact: true })).toHaveCount(0);
  await taskNode.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Nombre de la tarea")).toHaveValue("Revisar solicitud");
  const canvasHeightBeforeDeleteWarning = (await canvasShell.boundingBox())?.height;
  await page.getByRole("button", { name: "Eliminar elemento" }).click();
  await expect(page.getByRole("button", { name: "Sí, eliminar elemento" })).toBeVisible();
  const tallCanvasBox = await canvasShell.boundingBox();
  const tallEditorColumnBox = await editorColumn.boundingBox();
  if (!tallCanvasBox || !tallEditorColumnBox || canvasHeightBeforeDeleteWarning === undefined) {
    throw new Error("Tall Workflow Properties state was not measurable.");
  }
  expect(tallCanvasBox.height).toBe(tallEditorColumnBox.height);
  expect(tallCanvasBox.height).toBeGreaterThanOrEqual(canvasHeightBeforeDeleteWarning);
  await page.getByRole("button", { name: "Cancelar" }).click();
  await taskNode.focus();
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
  const labeledEdgePath = labeledEdge.locator(".react-flow__edge-path");
  const labelBox = await page.getByText("Solicitud revisada", { exact: true }).boundingBox();
  const edgeGeometry = await labeledEdgePath.evaluate((path) => {
    const svgPath = path as SVGPathElement;
    const matrix = svgPath.getScreenCTM();
    const screenPoint = (point: DOMPoint) => {
      const transformed = matrix ? point.matrixTransform(matrix) : point;
      return { x: transformed.x, y: transformed.y };
    };
    return {
      start: screenPoint(svgPath.getPointAtLength(0)),
      middle: screenPoint(svgPath.getPointAtLength(svgPath.getTotalLength() / 2)),
      end: screenPoint(svgPath.getPointAtLength(svgPath.getTotalLength()))
    };
  });
  const sourceHandleBox = await page.locator("#workflow-element-task-1 .moviqo-workflow-handle.react-flow__handle-right").boundingBox();
  const targetHandleBox = await page.locator("#workflow-element-end-1 .moviqo-workflow-handle.react-flow__handle-left").boundingBox();
  if (!sourceHandleBox || !targetHandleBox || !labelBox) {
    throw new Error("Workflow edge endpoints or label were not measurable.");
  }
  expect(Math.abs(edgeGeometry.start.x - (sourceHandleBox.x + sourceHandleBox.width)))
    .toBeLessThanOrEqual(4);
  expect(Math.abs(edgeGeometry.start.y - (sourceHandleBox.y + sourceHandleBox.height / 2)))
    .toBeLessThanOrEqual(4);
  expect(Math.abs(edgeGeometry.end.x - targetHandleBox.x))
    .toBeLessThanOrEqual(4);
  expect(Math.abs(edgeGeometry.end.y - (targetHandleBox.y + targetHandleBox.height / 2)))
    .toBeLessThanOrEqual(4);
  expect((labelBox?.y ?? 0) + (labelBox?.height ?? 0)).toBeLessThan(edgeGeometry.middle.y);
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

test("edge labels avoid top clipping and vertical path overlap when wrapping", async ({ page }) => {
  const labelWorkflowId = "01987df4-ae8a-7000-8000-000000000250";
  const topLabel = "Resultado superior con explicación extensa";
  const verticalLabel = "Continuación vertical con contexto completo";
  const draft = {
    schemaVersion: 7,
    draftId: "01987df4-ae8a-7000-8000-000000000251",
    workflowId: labelWorkflowId,
    name: "Etiquetas geométricas",
    status: "draft",
    elements: [
      { id: "start-1", type: "start", label: "Start" },
      {
        id: "task-1",
        type: "task",
        label: "Revisar geometría",
        assignment: { mode: "workflowInitiator", membershipId: null }
      },
      { id: "end-1", type: "end", label: "End" }
    ],
    connections: [
      {
        id: "connection-top",
        type: "sequence",
        sourceId: "start-1",
        targetId: "task-1",
        label: topLabel
      },
      {
        id: "connection-vertical",
        type: "sequence",
        sourceId: "task-1",
        targetId: "end-1",
        label: verticalLabel
      }
    ],
    processFields: [],
    formBindings: [],
    publication: {
      starter: { mode: "allActiveMembers", teamIds: [], membershipIds: [] }
    },
    layout: {
      positions: {
        "start-1": { x: 80, y: 0 },
        "task-1": { x: 280, y: 0 },
        "end-1": { x: 280, y: 240 }
      }
    }
  };

  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authenticatedSession)
    });
  });
  await page.route(`**/api/v1/workflow-design/workflows/${labelWorkflowId}/draft/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...createAcceptedWorkflow("1", draft),
        workflowId: labelWorkflowId,
        name: draft.name
      })
    });
  });

  await page.goto(`/workflows/${labelWorkflowId}/design`);
  const canvas = page.locator(".react-flow");
  await expect(canvas).toBeVisible();
  const topLabelElement = page.locator('[data-workflow-edge-label="connection-top"]');
  const verticalLabelElement = page.locator('[data-workflow-edge-label="connection-vertical"]');
  await expect(topLabelElement).toHaveText(topLabel);
  await expect(verticalLabelElement).toHaveText(verticalLabel);

  const edgeMidpoint = async (connectionId: string) => page
    .locator(`.react-flow__edge[data-id="${connectionId}"] .react-flow__edge-path`)
    .evaluate((path) => {
      const svgPath = path as SVGPathElement;
      const midpoint = svgPath.getPointAtLength(svgPath.getTotalLength() / 2);
      const matrix = svgPath.getScreenCTM();
      const transformed = matrix ? midpoint.matrixTransform(matrix) : midpoint;
      return { x: transformed.x, y: transformed.y };
    });
  const canvasBox = await canvas.boundingBox();
  const topLabelBox = await topLabelElement.boundingBox();
  const verticalLabelBox = await verticalLabelElement.boundingBox();
  if (!canvasBox || !topLabelBox || !verticalLabelBox) {
    throw new Error("Workflow edge label geometry was not measurable.");
  }
  const topMidpoint = await edgeMidpoint("connection-top");
  const verticalMidpoint = await edgeMidpoint("connection-vertical");

  expect(topLabelBox.y).toBeGreaterThanOrEqual(canvasBox.y);
  expect(topLabelBox.y).toBeGreaterThan(topMidpoint.y);
  await expect(topLabelElement).toHaveCSS("max-width", "104px");
  expect(topLabelBox.height).toBeGreaterThan(30);
  expect(verticalLabelBox.x).toBeGreaterThan(verticalMidpoint.x);
  await expect(verticalLabelElement).toHaveCSS("max-width", "104px");
  expect(verticalLabelBox.height).toBeGreaterThan(30);
});
