import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { createRequire } from "node:module";
import { translate } from "../../src/shared/localization";
import { assertNoAccessibilityViolations } from "./support/deployedJourney";
import { mockCsrfBootstrap } from "./support/mockCsrf";
import {
  createPreviewQualificationEvidence,
  previewProfileById,
  type PreviewLanguage,
  type PreviewQualificationProfile
} from "./support/stakeholderPreview";

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

const workflowName = "Caso bilingue / Bilingual case";
const fieldLabel = "Referencia conservada / Preserved reference";

const workflowAccepted = {
  workflowId: "01987df4-ae8a-7000-8000-000000000110",
  organizationId: "018f6d8c-6a58-7000-8000-000000000002",
  createdByMembershipId: "018f6d8c-6a58-7000-8000-000000000001",
  configurationDirectory: {
    memberships: [
      {
        membershipId: "018f6d8c-6a58-7000-8000-000000000001",
        displayName: "Ana",
        role: "owner"
      }
    ],
    teams: []
  },
  name: workflowName,
  revision: "1",
  draft: {
    schemaVersion: 4,
    draftId: "01987df4-ae8a-7000-8000-000000000111",
    workflowId: "01987df4-ae8a-7000-8000-000000000110",
    name: workflowName,
    status: "draft",
    elements: [],
    connections: [],
    processFields: [],
    formBindings: []
  }
};

const interfaceCopy = {
  en: {
    create: "Create workflow",
    fieldLabel: "Label",
    language: "Language"
  },
  es: {
    create: "Crear flujo",
    fieldLabel: "Etiqueta",
    language: "Idioma"
  }
} as const;

const qualificationContext = (testInfo: TestInfo) => {
  const metadata = testInfo.project.metadata as {
    interfaceLanguage?: PreviewLanguage;
    previewProfileId?: PreviewQualificationProfile["id"];
  };
  if (!metadata.interfaceLanguage || !metadata.previewProfileId) {
    throw new Error("Preview project metadata is incomplete.");
  }
  return {
    language: metadata.interfaceLanguage,
    profile: previewProfileById(metadata.previewProfileId)
  };
};

const mockWorkflowAuthoring = async (page: Page) => {
  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      body: JSON.stringify(authenticatedSession),
      contentType: "application/json",
      status: 200
    });
  });
  await page.route("**/api/v1/workflow-design/workflows/", async (route, request) => {
    if (request.method() !== "POST") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      body: JSON.stringify(workflowAccepted),
      contentType: "application/json",
      status: 201
    });
  });
};

const mockAuthenticatedSession = async (page: Page) => {
  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      body: JSON.stringify(authenticatedSession),
      contentType: "application/json",
      status: 200
    });
  });
};

const expectNoHorizontalOverflow = async (page: Page) => {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);
};

const expectPracticalTarget = async (page: Page, selector: ReturnType<Page["getByRole"]>) => {
  const box = await selector.boundingBox();
  expect(box, "Expected an actionable control with measurable geometry.").not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
};

const expectReducedMotion = async (page: Page) => {
  expect(await page.emulateMedia({ reducedMotion: "reduce" }).then(async () =>
    page.locator(".button").first().evaluate((element) => {
      const style = window.getComputedStyle(element);
      const durationInSeconds = (value: string) => Number.parseFloat(value);
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        durationInSeconds(style.animationDuration) <= 0.001 &&
        durationInSeconds(style.transitionDuration) <= 0.001;
    })
  )).toBe(true);
};

test("desktop authoring localizes owned copy and preserves Designer content", async ({ page }, testInfo) => {
  const { language, profile } = qualificationContext(testInfo);
  test.skip(!profile.fullAuthoring, "Desktop authoring qualification only.");
  const copy = interfaceCopy[language];
  const nextLanguage: PreviewLanguage = language === "es" ? "en" : "es";
  const nextCopy = interfaceCopy[nextLanguage];

  await mockWorkflowAuthoring(page);
  await page.goto(`/my-work/workflows/new?lang=${language}`);

  await expect(page.getByRole("heading", { level: 1, name: copy.create })).toBeVisible();
  await page.getByLabel(copy.create === "Crear flujo" ? "Nombre del flujo" : "Workflow name").fill(workflowName);
  await page.getByRole("button", { name: copy.create }).click();
  await expect(page.getByRole("heading", { name: /inicio, tarea y fin|start, task, and end/i })).toBeVisible();
  await page.getByLabel(copy.fieldLabel).fill(fieldLabel);

  await page.getByRole("combobox", { name: copy.language }).selectOption(nextLanguage);

  await expect(page.getByRole("heading", { level: 1, name: nextCopy.create })).toBeVisible();
  await expect(page.getByLabel(nextCopy.create === "Crear flujo" ? "Nombre del flujo" : "Workflow name")).toHaveValue(workflowName);
  await expect(page.getByLabel(nextCopy.fieldLabel)).toHaveValue(fieldLabel);
});

test("mobile participant profile does not claim full workflow authoring support", async ({ page }, testInfo) => {
  const { language, profile } = qualificationContext(testInfo);
  test.skip(profile.fullAuthoring, "Mobile participant qualification only.");

  await mockWorkflowAuthoring(page);
  await page.goto(`/my-work/workflows/new?lang=${language}`);

  const limitation = page.getByRole("note");
  await expect(limitation).toContainText(/1280.*720/);
  await expect(page.getByLabel(language === "es" ? "Nombre del flujo" : "Workflow name")).toBeHidden();
});

test("mobile participant timeline reflows and preserves Designer content", async ({ page }, testInfo) => {
  const { language, profile } = qualificationContext(testInfo);
  test.skip(profile.fullAuthoring, "Mobile participant qualification only.");
  const processId = "01987df4-ae8a-7000-8000-000000000211";

  await mockAuthenticatedSession(page);
  await page.route(`**/api/v1/my-work/processes/${processId}/`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        header: {
          completedAt: "2026-08-10T15:00:00Z",
          contributionSummary: { kind: "initiated", label: "Started by Ana" },
          currentStep: "End",
          lastActivityAt: "2026-08-10T15:00:00Z",
          processId,
          processNumber: "process-",
          startedAt: "2026-08-10T14:00:00Z",
          systemStatus: "completed",
          workflowName,
          workflowVersionNumber: 1
        },
        timeline: [
          {
            actorDisplay: "Ana",
            eventKind: "workflow-runtime.process-started",
            label: "Process started",
            occurredAt: "2026-08-10T14:00:00Z",
            taskPosition: "Start"
          },
          {
            actorDisplay: "Ana",
            eventKind: "workflow-runtime.process-completed",
            label: "Process completed",
            occurredAt: "2026-08-10T15:00:00Z",
            taskPosition: "End"
          }
        ]
      }),
      contentType: "application/json",
      status: 200
    });
  });

  await page.goto(`/my-work/processes/${processId}?lang=${language}`);
  await page.addStyleTag({ content: "html { font-size: 200%; }" });

  await expect(page.getByRole("heading", { level: 1, name: workflowName })).toBeVisible();
  const timeline = page.getByRole("region", { name: translate(language, "processDetail.timelineTitle") });
  await expect(timeline.getByText(translate(language, "processDetail.event.processStarted"))).toBeVisible();
  await expect(timeline.getByText(translate(language, "processDetail.event.processCompleted"))).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("qualification profile records an automated accessibility baseline", async ({
  browser,
  browserName,
  page
}, testInfo) => {
  const { language, profile } = qualificationContext(testInfo);
  const copy = interfaceCopy[language];

  await mockWorkflowAuthoring(page);
  await page.goto(`/my-work/workflows/new?lang=${language}`);
  await page.addStyleTag({ content: "html { font-size: 200%; }" });

  const workLink = page.getByRole("link", { name: language === "es" ? "Mi trabajo" : "My work" });
  await workLink.focus();
  await expect(workLink).toBeFocused();
  expect(await workLink.evaluate((element) => window.getComputedStyle(element).outlineWidth)).not.toBe("0px");
  await expectNoHorizontalOverflow(page);
  await expectPracticalTarget(page, page.getByRole("combobox", { name: copy.language }));
  await expectPracticalTarget(page, page.getByRole("button", { name: language === "es" ? "Salir" : "Sign out" }));
  await expectReducedMotion(page);
  await assertNoAccessibilityViolations(page, axePath, testInfo);

  await testInfo.attach("preview-qualification-evidence", {
    body: Buffer.from(JSON.stringify({
      ...createPreviewQualificationEvidence({
        browserName,
        browserVersion: browser.version(),
        interfaceLanguage: language,
        profile,
        projectName: testInfo.project.name,
        reducedMotion: "reduce",
        textScalePercent: 200
      }),
      automatedChecks: [
        "headings-and-labels",
        "focus-order-and-visibility",
        "contrast-tokens",
        "reduced-motion",
        "practical-touch-targets",
        "text-scale-200-percent"
      ]
    }, null, 2), "utf-8"),
    contentType: "application/json"
  });
});

test("unexpected workflow failure preserves work and suppresses a duplicate action", async ({ page }, testInfo) => {
  const { language, profile } = qualificationContext(testInfo);
  test.skip(!profile.fullAuthoring, "Desktop authoring qualification only.");
  let createCalls = 0;

  await mockAuthenticatedSession(page);
  await page.route("**/api/v1/workflow-design/workflows/", async (route, request) => {
    if (request.method() !== "POST") {
      await route.fallback();
      return;
    }
    createCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      body: JSON.stringify({
        code: "api_error",
        correlationId: "safe-preview-correlation",
        invalidParams: [],
        status: 500,
        title: "Unsafe internal failure detail",
        type: "https://api.moviqo.local/problems/api-error"
      }),
      contentType: "application/problem+json",
      headers: { "X-Correlation-ID": "safe-preview-correlation" },
      status: 500
    });
  });
  await page.goto(`/my-work/workflows/new?lang=${language}`);

  const nameInput = page.getByLabel(translate(language, "workflowDesign.create.name"));
  const submit = page.getByRole("button", { name: translate(language, "workflowDesign.create.submit") });
  await nameInput.fill(workflowName);
  await submit.click();
  await expect(page.getByRole("button", { name: translate(language, "workflowDesign.create.submitting") })).toBeDisabled();
  await expect(page.getByRole("heading", { name: translate(language, "workflowDesign.editor.title") })).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText(translate(language, "workflowDesign.create.error"));
  await expect(page.getByRole("alert")).toHaveAttribute("data-error-code", "api_error");
  await expect(page.getByRole("alert")).not.toContainText("Unsafe internal failure detail");
  await expect(nameInput).toHaveValue(workflowName);
  expect(createCalls).toBe(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("offline recovery and permission denial remain localized and data safe", async ({ page }, testInfo) => {
  const { language } = qualificationContext(testInfo);
  let dashboardCalls = 0;

  await mockAuthenticatedSession(page);
  await page.route("**/api/v1/my-work/", async (route) => {
    dashboardCalls += 1;
    if (dashboardCalls === 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.abort("internetdisconnected");
      return;
    }
    if (dashboardCalls === 2) {
      await route.fulfill({
        body: JSON.stringify({
          myProcesses: { hasMore: false, items: [], limit: 12 },
          myTasks: { hasMore: false, items: [], limit: 12 },
          startWorkflows: { hasMore: false, items: [], limit: 6 }
        }),
        contentType: "application/json",
        status: 200
      });
      return;
    }
    await route.fulfill({
      body: JSON.stringify({
        code: "permission_denied",
        correlationId: "safe-preview-denial",
        invalidParams: [],
        status: 403,
        title: "Restricted process exists",
        type: "https://api.moviqo.local/problems/permission-denied"
      }),
      contentType: "application/problem+json",
      status: 403
    });
  });

  await page.goto(`/my-work?lang=${language}`);
  await expect(page.getByRole("alert").first()).toContainText(translate(language, "myWork.error"));
  await expect(page.getByText("Restricted process exists")).toHaveCount(0);
  await page.getByRole("button", { name: translate(language, "myWork.retry") }).first().click();
  await expect(page.getByRole("heading", { name: translate(language, "myWork.title") })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByText("Restricted process exists")).toHaveCount(0);
});
