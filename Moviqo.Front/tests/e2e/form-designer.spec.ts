import { expect, test } from "@playwright/test";
import { mockCsrfBootstrap } from "./support/mockCsrf";

const workflowId = "01987df4-ae8a-7000-8000-000000000310";
const taskElementId = "task-1";
const taskId = "01987df4-ae8a-7000-8000-000000000311";
const organizationId = "018f6d8c-6a58-7000-8000-000000000002";

type TestProcessField = {
  id: string;
  kind: "shortText";
  label: string;
  helpText: string;
  placeholder: string;
  defaultValue: string | null;
  minimumLength: number;
  maximumLength: number;
};

type TestFormBinding = {
  id: string;
  kind: "field" | "section" | "heading" | "instruction" | "divider";
  taskElementId: string;
  fieldId?: string;
  label?: string | null;
  content?: string;
  width: "full" | "half" | "third" | "quarter";
  position: number;
};

const projectRuntimeForm = (draft: Record<string, unknown>) => {
  const fields = (draft.processFields as TestProcessField[] | undefined) ?? [];
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const bindings = ((draft.formBindings as TestFormBinding[] | undefined) ?? [])
    .filter((binding) => binding.taskElementId === taskElementId)
    .sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));
  const controls = bindings.flatMap((binding) => {
    if (binding.kind !== "field" || !binding.fieldId) return [];
    const field = fieldsById.get(binding.fieldId);
    if (!field) return [];
    return [{
      controlId: binding.id,
      fieldId: field.id,
      kind: field.kind,
      label: binding.label || field.label,
      helpText: field.helpText,
      placeholder: field.placeholder,
      width: binding.width,
      position: binding.position,
      value: field.defaultValue ?? "",
      required: field.minimumLength > 0,
      minimumLength: field.minimumLength,
      maximumLength: field.maximumLength,
    }];
  });
  const controlById = new Map(controls.map((control) => [control.controlId, control]));
  return {
    controls,
    items: bindings.map((binding) => binding.kind === "field"
      ? { itemId: binding.id, ...controlById.get(binding.id)! }
      : {
          itemId: binding.id,
          kind: binding.kind,
          ...(binding.content === undefined ? {} : { content: binding.content }),
          width: binding.width,
          position: binding.position,
        })
  };
};

const session = {
  authenticated: true,
  user: { id: 1, displayName: "Ana", preferredLanguage: "es" },
  membership: {
    id: "018f6d8c-6a58-7000-8000-000000000001",
    organizationId,
    organizationTimezone: "America/Bogota",
    role: "owner",
  },
};

const accepted = (revision: string, draft: Record<string, unknown>) => ({
  workflowId,
  organizationId,
  createdByMembershipId: session.membership.id,
  configurationDirectory: { memberships: [], teams: [] },
  name: "Solicitudes",
  revision,
  draft,
});

test("Form Designer persists explicit pointer and keyboard composition with runtime parity", async ({ page }) => {
  test.slow();
  let revision = "1";
  let savedDraft: Record<string, unknown> = {
    schemaVersion: 8,
    draftId: "01987df4-ae8a-7000-8000-000000000312",
    workflowId,
    name: "Solicitudes",
    status: "draft",
    elements: [
      { id: "start-1", type: "start", label: "Inicio" },
      { id: taskElementId, type: "task", label: "Revisar solicitud" },
      { id: "end-1", type: "end", label: "Fin" },
    ],
    connections: [],
    processFields: [],
    formBindings: [],
    publication: { starter: { mode: "unconfigured", teamIds: [], membershipIds: [] } },
    layout: { positions: {} },
  };
  let saveCount = 0;

  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session) });
  });
  await page.route(`**/api/v1/workflow-design/workflows/${workflowId}/draft/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(accepted(revision, savedDraft)),
    });
  });
  await page.route(`**/api/v1/workflow-design/workflows/${workflowId}/tasks/${taskElementId}/form-authoring-lease/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        workflowId,
        taskElementId,
        mode: "editable",
        leaseToken: "01987df4-ae8a-7000-8000-000000000319",
        leaseExpiresAt: "2026-08-13T12:01:00Z",
        heartbeatAfterSeconds: 20,
        holder: {
          membershipId: session.membership.id,
          displayName: session.user.displayName,
        },
      }),
    });
  });
  await page.route(`**/api/v1/workflow-design/workflows/${workflowId}/tasks/${taskElementId}/form-draft/`, async (route) => {
    saveCount += 1;
    const body = route.request().postDataJSON() as {
      draft: Record<string, unknown>;
      leaseToken: string;
    };
    expect(body.leaseToken).toBe("01987df4-ae8a-7000-8000-000000000319");
    savedDraft = body.draft;
    revision = String(Number(revision) + 1);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(accepted(revision, savedDraft)),
    });
  });
  await page.route(`**/api/v1/my-work/tasks/${taskId}/form/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        taskId,
        processId: "01987df4-ae8a-7000-8000-000000000410",
        workflowId,
        workflowVersionId: "01987df4-ae8a-7000-8000-000000000411",
        workflowName: "Solicitudes",
        taskTitle: "Revisar solicitud",
        taskElementId,
        status: "assigned",
        taskRevision: "1",
        definitionRevision: revision,
        actions: { saveDraft: true, complete: true },
        form: projectRuntimeForm(savedDraft),
      }),
    });
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/workflows/${workflowId}/tasks/${taskElementId}/form`);
  await expect(page.getByRole("heading", { level: 1, name: "Diseñador de formulario" })).toBeVisible();
  await expect(page.getByText("Solicitudes · Revisar solicitud")).toBeVisible();

  await page.getByRole("button", { name: "Texto corto" }).click();
  await page.getByLabel("Etiqueta").fill("Nombre de la persona solicitante");
  await page.getByLabel("Texto de ayuda").fill("Usa el nombre completo.");
  await page.getByLabel("Texto de ejemplo").fill("Ejemplo: Ana Pérez");
  await page.getByLabel("Campo obligatorio").check();
  await page.getByLabel("Ancho").selectOption("half");
  await page.getByRole("button", { name: "Encabezado" }).click();
  await page.getByLabel("Contenido").fill("Detalles de la solicitud");
  await page.getByRole("button", { name: "Separador" }).click();
  await page.getByRole("button", { name: "Texto de instrucciones" }).dragTo(
    page.getByRole("heading", { level: 2, name: "Lienzo del formulario" })
  );
  await expect(page.getByLabel("Contenido")).toHaveValue(
    "Agrega instrucciones para la persona que complete la tarea."
  );
  await page.getByRole("button", { name: "Sección" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Contenido")).toHaveValue("Nueva sección");
  expect(saveCount).toBe(0);

  const dragHandles = page.getByRole("button", { name: "Arrastrar para reordenar" });
  await expect(dragHandles).toHaveCount(5);
  await dragHandles.nth(1).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect(page.locator("#form-designer-item-heading-2")).toBeVisible();

  await dragHandles.nth(2).dragTo(dragHandles.nth(1));
  expect(saveCount).toBe(0);
  await expect(page.getByRole("heading", { level: 3, name: "Detalles de la solicitud" })).toBeVisible();
  await expect(page.getByLabel("Nombre de la persona solicitante")).toHaveAttribute("disabled", "");

  await page.keyboard.press("Control+S");
  await expect.poll(() => saveCount).toBe(1);
  await expect(page.getByText("Borrador guardado")).toBeVisible();
  expect((savedDraft.formBindings as Array<{ id: string; width: string }>).find(
    (item) => item.id === "binding-1"
  )?.width).toBe("half");

  await page.reload();
  await expect(page.getByText("Nombre de la persona solicitante", { exact: true }).first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto(`/my-work/tasks/${taskId}`);
  await expect(page.getByRole("heading", { level: 3, name: "Detalles de la solicitud" })).toBeVisible();
  await expect(page.getByLabel("Nombre de la persona solicitante")).toHaveAttribute("required", "");
  await expect(page.getByText("Usa el nombre completo.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
