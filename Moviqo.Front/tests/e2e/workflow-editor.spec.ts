import { expect, test, type Page } from "@playwright/test";
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

const readEdgeMarkerVisual = async (
  page: Page,
  connectionId: string,
  targetElementId: string
) => page.locator(`.react-flow__edge[data-id="${connectionId}"] .react-flow__edge-path`)
  .evaluate((path, targetId) => {
    const markerEnd = path.getAttribute("marker-end") ?? "";
    const markerUrl = markerEnd.startsWith("url(")
      ? markerEnd.slice(4, -1).replace(/^['"]|['"]$/g, "")
      : "";
    const markerId = markerUrl.includes("#")
      ? markerUrl.slice(markerUrl.lastIndexOf("#") + 1)
      : "";
    const marker = markerId ? document.getElementById(markerId) : null;
    const arrow = marker?.querySelector(".arrowclosed") ?? null;
    const markerElement = marker instanceof SVGMarkerElement ? marker : null;
    const arrowElement = arrow instanceof SVGGraphicsElement ? arrow : null;
    const markerWidth = Number(markerElement?.getAttribute("markerWidth") ?? 0);
    const markerViewBox = markerElement?.viewBox.baseVal;
    const arrowBox = arrowElement?.getBBox();
    const svgPath = path as SVGPathElement;
    const matrix = svgPath.getScreenCTM();
    const pathScale = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
    const pathStrokeWidth = Number.parseFloat(getComputedStyle(path).strokeWidth) || 1;
    const markerUnitScale = markerElement?.getAttribute("markerUnits") === "userSpaceOnUse"
      ? 1
      : pathStrokeWidth;
    const end = svgPath.getPointAtLength(svgPath.getTotalLength());
    const screenEnd = matrix ? end.matrixTransform(matrix) : end;
    const targetHandle = document.querySelector(
      `#workflow-element-${CSS.escape(targetId)} .moviqo-workflow-handle.react-flow__handle-left`
    );
    const targetRect = targetHandle?.getBoundingClientRect() ?? null;
    const portVisualWidth = targetHandle
      ? Number.parseFloat(getComputedStyle(targetHandle, "::before").width)
      : 0;
    const handleCssWidth = targetHandle
      ? Number.parseFloat(getComputedStyle(targetHandle).width)
      : 0;
    const handleScale = targetRect && handleCssWidth > 0
      ? targetRect.width / handleCssWidth
      : 1;
    const portRadius = portVisualWidth * handleScale / 2;
    const markerTail = markerViewBox && markerViewBox.width > 0 && arrowBox
      ? Math.abs(arrowBox.x - (markerElement?.refX.baseVal.value ?? 0))
        * markerWidth / markerViewBox.width * markerUnitScale * pathScale
      : 0;
    return {
      markerEnd,
      markerFound: marker !== null && arrow !== null,
      markerWidth,
      markerHeight: Number(marker?.getAttribute("markerHeight") ?? 0),
      markerFill: arrow ? getComputedStyle(arrow).fill : "",
      pathStroke: getComputedStyle(path).stroke,
      markerTail,
      portRadius,
      visibleArrowTail: markerTail - portRadius,
      endpointDistance: targetRect
        ? Math.hypot(
            screenEnd.x - targetRect.x,
            screenEnd.y - (targetRect.y + targetRect.height / 2)
          )
        : Number.POSITIVE_INFINITY
    };
  }, targetElementId);

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

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/workflows/${workflowId}/design`);
  await expect(page.getByRole("heading", { level: 1, name: "Diseña tu flujo de trabajo" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Ruta de aprobacion" })).toBeVisible();
  await expect(page.getByText("Primer camino ejecutable", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Lienzo del flujo", { exact: true })).toHaveCount(0);
  const compactSaveStatus = page.locator('[data-workflow-save-status="compact"]');
  await expect(compactSaveStatus).toContainText("Cambios guardados · Revisión 1");
  await expect(page.getByRole("heading", { name: "Estado del borrador" })).toHaveCount(0);
  const compactHeader = page.locator('[data-page-header-layout="three-region"]');
  const headerRegions = compactHeader.locator("[data-page-header-region]");
  await expect(headerRegions).toHaveCount(3);
  const breadcrumb = compactHeader.getByRole("navigation");
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Flujos" })).toHaveAttribute("href", "/workflows");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Ruta de aprobacion");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const backButton = page.getByRole("button", { name: "Volver a flujos" });
  const backButtonBox = await backButton.boundingBox();
  const breadcrumbLinkBox = await breadcrumb.getByRole("link", { name: "Flujos" }).boundingBox();
  if (!backButtonBox || !breadcrumbLinkBox) {
    throw new Error("Workflow header actions were not measurable.");
  }
  expect(backButtonBox.width).toBeGreaterThanOrEqual(44);
  expect(backButtonBox.height).toBeGreaterThanOrEqual(44);
  expect(breadcrumbLinkBox.height).toBeGreaterThanOrEqual(44);
  const desktopHeaderBoxes = await headerRegions.evaluateAll((regions) => regions.map((region) => {
    const rect = region.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom };
  }));
  expect(Math.max(...desktopHeaderBoxes.map((box) => box.top)))
    .toBeLessThan(Math.min(...desktopHeaderBoxes.map((box) => box.bottom)));
  expect(await compactHeader.evaluate((header) => header.scrollWidth <= header.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1024, height: 720 });
  const narrowHeaderBoxes = await headerRegions.evaluateAll((regions) => regions.map((region) => {
    const rect = region.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom };
  }));
  expect(narrowHeaderBoxes[1]?.top).toBeGreaterThanOrEqual(narrowHeaderBoxes[0]?.bottom ?? 0);
  expect(narrowHeaderBoxes[2]?.top).toBeGreaterThanOrEqual(narrowHeaderBoxes[1]?.bottom ?? 0);
  expect(await compactHeader.evaluate((header) => header.scrollWidth <= header.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const enlargedBackButtonBox = await backButton.boundingBox();
  if (!enlargedBackButtonBox) throw new Error("Enlarged Workflow back action was not measurable.");
  expect(enlargedBackButtonBox.x).toBeGreaterThanOrEqual(0);
  expect(enlargedBackButtonBox.x + enlargedBackButtonBox.width).toBeLessThanOrEqual(1024);
  await backButton.focus();
  await expect(backButton).toBeFocused();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.setViewportSize({ width: 1280, height: 720 });

  await expect(page.getByRole("button", { name: "Agregar Inicio" })).toHaveCount(0);
  await page.getByRole("button", { name: "Agregar Tarea" }).click();
  await expect(compactSaveStatus).toContainText("Cambios sin guardar");
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
  const handles = [
    page.locator("#workflow-element-start-1 .moviqo-workflow-handle.react-flow__handle-right"),
    page.locator("#workflow-element-task-1 .moviqo-workflow-handle.react-flow__handle-left"),
    handle,
    page.locator("#workflow-element-end-1 .moviqo-workflow-handle.react-flow__handle-left")
  ];
  for (const workflowHandle of handles) {
    await expect(workflowHandle).toHaveCSS("width", "44px");
    await expect(workflowHandle).toHaveCSS("height", "44px");
    expect(await workflowHandle.evaluate((node) => getComputedStyle(node, "::before").width)).toBe("6px");
    expect(await workflowHandle.evaluate((node) => getComputedStyle(node, "::before").height)).toBe("6px");
    await workflowHandle.focus();
    await expect(workflowHandle).toBeFocused();
    await expect(workflowHandle).toHaveCSS("outline-width", "3px");
    await expect(workflowHandle).toHaveCSS("outline-style", "solid");
  }
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
  const normalEdgeVisuals = await Promise.all([
    readEdgeMarkerVisual(page, "connection-1", "task-1"),
    readEdgeMarkerVisual(page, "connection-2", "end-1")
  ]);
  for (const visual of normalEdgeVisuals) {
    expect(visual.markerEnd).toMatch(/^url\(.+\)$/);
    expect(visual.markerFound).toBe(true);
    expect(visual.markerWidth).toBe(24);
    expect(visual.markerHeight).toBe(24);
    expect(visual.visibleArrowTail).toBeGreaterThanOrEqual(2);
    expect(visual.markerFill).toBe(visual.pathStroke);
    expect(visual.markerFill).toBe("rgb(71, 85, 105)");
    expect(visual.endpointDistance).toBeLessThanOrEqual(visual.portRadius);
  }
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
  const endpointTolerance = await handle.evaluate((node) => {
    const handleWidth = Number.parseFloat(getComputedStyle(node).width);
    const handleScale = handleWidth > 0 ? node.getBoundingClientRect().width / handleWidth : 1;
    return Number.parseFloat(getComputedStyle(node, "::before").width) * handleScale / 2;
  });
  expect(Math.abs(edgeGeometry.start.x - (sourceHandleBox.x + sourceHandleBox.width)))
    .toBeLessThanOrEqual(endpointTolerance);
  expect(Math.abs(edgeGeometry.start.y - (sourceHandleBox.y + sourceHandleBox.height / 2)))
    .toBeLessThanOrEqual(endpointTolerance);
  expect(Math.abs(edgeGeometry.end.x - targetHandleBox.x))
    .toBeLessThanOrEqual(endpointTolerance);
  expect(Math.abs(edgeGeometry.end.y - (targetHandleBox.y + targetHandleBox.height / 2)))
    .toBeLessThanOrEqual(endpointTolerance);
  expect((labelBox?.y ?? 0) + (labelBox?.height ?? 0)).toBeLessThan(edgeGeometry.middle.y);
  await labeledEdge.focus();
  await page.keyboard.press("Enter");
  const selectedEdgeVisual = await readEdgeMarkerVisual(page, "connection-2", "end-1");
  const remainingNormalEdgeVisual = await readEdgeMarkerVisual(page, "connection-1", "task-1");
  expect(selectedEdgeVisual.markerFill).toBe(selectedEdgeVisual.pathStroke);
  expect(selectedEdgeVisual.markerFill).toBe("rgb(37, 99, 235)");
  expect(selectedEdgeVisual.markerWidth).toBe(24);
  expect(selectedEdgeVisual.markerHeight).toBe(24);
  expect(selectedEdgeVisual.visibleArrowTail).toBeGreaterThanOrEqual(2);
  expect(selectedEdgeVisual.endpointDistance).toBeLessThanOrEqual(selectedEdgeVisual.portRadius);
  expect(remainingNormalEdgeVisual.markerFill).toBe(remainingNormalEdgeVisual.pathStroke);
  expect(remainingNormalEdgeVisual.markerFill).toBe("rgb(71, 85, 105)");
  await expect(page.getByLabel("Etiqueta de la conexión")).toHaveValue("Solicitud revisada");
  await page.getByLabel("Etiqueta de la conexión").fill("Solicitud lista para publicar");
  await expect(page.getByRole("button", { name: /Validar publicaci/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Publicar versi/ }).click();
  await expect(page.getByText(/versi.n publicada.*Versi.n 1/i)).toBeVisible();
  expect(publishBody).toMatchObject({ expectedRevision: "3" });
  expect((publishBody?.draft as { connections: Array<{ label?: string }> }).connections[1]?.label)
    .toBe("Solicitud lista para publicar");
});

test("revision conflict expands focused recovery and reapplies local work after reload", async ({ page }) => {
  const conflictWorkflowId = "01987df4-ae8a-7000-8000-000000000240";
  const initialDraft = {
    schemaVersion: 7,
    draftId: "01987df4-ae8a-7000-8000-000000000241",
    workflowId: conflictWorkflowId,
    name: "Ruta compartida",
    status: "draft",
    elements: [{ id: "start-1", type: "start", label: "Start" }],
    connections: [],
    processFields: [],
    formBindings: [],
    layout: { positions: { "start-1": { x: 80, y: 120 } } }
  };
  const latestDraft = {
    ...initialDraft,
    layout: { positions: { "start-1": { x: 140, y: 160 } } }
  };
  let draftReadCount = 0;

  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authenticatedSession)
    });
  });
  await page.route(`**/api/v1/workflow-design/workflows/${conflictWorkflowId}/draft/`, async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({
        status: 409,
        contentType: "application/problem+json",
        body: JSON.stringify({
          type: "https://api.moviqo.local/problems/workflow-draft-revision-conflict",
          title: "Revision conflict",
          status: 409,
          code: "workflow_draft_revision_conflict",
          correlationId: "workflow-conflict-test"
        })
      });
      return;
    }
    draftReadCount += 1;
    const latest = draftReadCount > 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...createAcceptedWorkflow(latest ? "2" : "1", latest ? latestDraft : initialDraft),
        workflowId: conflictWorkflowId,
        name: initialDraft.name
      })
    });
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/workflows/${conflictWorkflowId}/design`);
  await page.getByRole("button", { name: "Agregar Tarea" }).click();
  await expect(page.getByRole("group", { name: "Tarea: Tarea" })).toBeVisible();
  await page.getByRole("button", { name: "Guardar borrador" }).click();

  const recoveryRegion = page.getByRole("region", { name: "Estado del borrador" });
  const conflictSummary = page.locator("#workflow-conflict-summary");
  const reloadLatest = page.getByRole("button", { name: "Cargar última versión" });
  const reapplyChanges = page.getByRole("button", { name: "Reaplicar mis cambios" });
  await expect(recoveryRegion).toBeVisible();
  await expect(conflictSummary).toBeFocused();
  await expect(page.getByText("Hay una versión más reciente del flujo", { exact: true }).first()).toBeVisible();
  await expect(reloadLatest).toBeEnabled();
  await expect(reapplyChanges).toBeDisabled();

  await reloadLatest.click();
  await expect(page.getByRole("group", { name: "Tarea: Tarea" })).toHaveCount(0);
  await expect(reapplyChanges).toBeEnabled();
  await reapplyChanges.click();

  await expect(recoveryRegion).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Tarea: Tarea" })).toBeVisible();
  await expect(page.locator('[data-workflow-save-status="compact"]'))
    .toContainText("Cambios sin guardar");
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeEnabled();
});

test("edge labels avoid top clipping and vertical path overlap when wrapping", async ({ page }) => {
  const labelWorkflowId = "01987df4-ae8a-7000-8000-000000000250";
  const longWorkflowName = "AprobaciónRegionalAdministrativaSinOportunidadesDeSaltoEnElNombreDelFlujo";
  const topLabel = "Resultado superior con explicación extensa";
  const verticalLabel = "Continuación vertical con contexto completo";
  const draft = {
    schemaVersion: 7,
    draftId: "01987df4-ae8a-7000-8000-000000000251",
    workflowId: labelWorkflowId,
    name: longWorkflowName,
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

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/workflows/${labelWorkflowId}/design`);
  const workflowHeading = page.getByRole("heading", { level: 2, name: longWorkflowName });
  await expect(workflowHeading).toBeVisible();
  expect(await workflowHeading.evaluate((heading) => heading.scrollWidth <= heading.clientWidth)).toBe(true);
  await expect(page.locator('[data-page-header-region="breadcrumb"] [aria-current="page"]'))
    .toHaveText(longWorkflowName);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
  await expect(topLabelElement).toHaveCSS("max-width", "80px");
  await expect(topLabelElement).toHaveCSS("font-size", "12px");
  await expect(topLabelElement).toHaveCSS("padding-left", "6px");
  await expect(topLabelElement).toHaveCSS("padding-top", "2px");
  expect(topLabelBox.height).toBeGreaterThan(24);
  expect(verticalLabelBox.x).toBeGreaterThan(verticalMidpoint.x);
  await expect(verticalLabelElement).toHaveCSS("max-width", "80px");
  await expect(verticalLabelElement).toHaveCSS("font-size", "12px");
  expect(verticalLabelBox.height).toBeGreaterThan(24);
});
