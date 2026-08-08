import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import {
  assertNoAccessibilityViolations,
  attachJourneyEvidence,
  createSyntheticJourneyRun,
  createSyntheticIdentity,
  performApiAction,
  readRequiredEnvironment,
  recordJourneyEvent,
  requestSyntheticVerificationToken,
  rotateSyntheticJourneyRun,
  safeReference,
  verifyDeployedBuild,
  waitForWorkflowPublicationReady,
  type JourneyTraceEvent
} from "./support/deployedJourney";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const journeyExpect = expect.configure({ timeout: 15_000 });

test("deployed first workflow journey covers registration through completed timeline", async (
  {
    page,
    request
  },
  testInfo
) => {
  test.setTimeout(180_000);

  const startedAt = Date.now();
  const syntheticKey = readRequiredEnvironment("MOVIQO_E2E_SYNTHETIC_KEY");
  const baseUrl = readRequiredEnvironment("MOVIQO_E2E_BASE_URL");
  const buildId = process.env.MOVIQO_E2E_BUILD_ID ?? "local-e2e";
  const identity = createSyntheticIdentity();
  const workflowName = `Primer flujo ${identity.runId}`;
  const journeyTrace: JourneyTraceEvent[] = [];
  const evidence = {
    buildId,
    durationMs: 0,
    host: new URL(baseUrl).host,
    organizationRef: "",
    processRef: "",
    taskRef: ""
  };
  let journeyError: unknown;
  let runToken = "";
  let taskReference = "";

  try {
    recordJourneyEvent(journeyTrace, startedAt, "verify deployed build", "started");
    await verifyDeployedBuild(request, buildId);
    recordJourneyEvent(journeyTrace, startedAt, "verify deployed build");
    runToken = await createSyntheticJourneyRun(request, {
      email: identity.email,
      syntheticKey
    });

    recordJourneyEvent(journeyTrace, startedAt, "register owner", "started");
    await test.step("register a clean synthetic owner organization", async () => {
    await page.goto("/");
    await page.getByRole("combobox", { name: /language|idioma/i }).selectOption("es");
    const registrationLink = page
      .getByRole("link", { name: "Iniciar beta gratuita" })
      .first();
    await journeyExpect(registrationLink).toBeVisible();
    await registrationLink.click();

    await journeyExpect(
      page.getByRole("heading", {
        name: "Registra la organizacion y a su primera persona responsable."
      })
    ).toBeVisible();
    await page.getByLabel("Nombre de la persona responsable").fill(identity.ownerName);
    await page.getByLabel("Nombre de la organizacion").fill(identity.organizationName);
    await page.getByLabel("Correo de acceso").fill(identity.email);
    await page.locator("#registration-password").fill(identity.password);
    await page.getByLabel("Region").fill("CO");
    await page.getByLabel("Zona horaria").fill("America/Bogota");
    await page.getByLabel("Moneda").fill("COP");
    await page.getByLabel(/acepto los terminos beta vigentes/i).check();
    await page.getByLabel(/acepto el aviso de privacidad vigente/i).check();
    await page.getByLabel(/no ingresare datos personales reales/i).check();
    await performApiAction(
      page,
      "POST",
      "/api/v1/organizations/registrations/",
      () => page.getByRole("button", { name: "Enviar registro" }).click()
    );
    await journeyExpect(page.locator(".success-message")).toContainText(identity.email);
    await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "register owner");

    recordJourneyEvent(journeyTrace, startedAt, "verify delivered email", "started");
    await test.step("verify the email through the synthetic outbox contract", async () => {
      const verificationToken = await requestSyntheticVerificationToken(request, {
        baseUrl,
        email: identity.email,
        runToken,
        syntheticKey
      });
      await page.goto("/verify-email");
      await page.evaluate((token) => {
        window.history.replaceState(
          null,
          "",
          `/verify-email?token=${encodeURIComponent(token)}`
        );
      }, verificationToken);
      await performApiAction(
        page,
        "POST",
        "/api/v1/organizations/registrations/verify-email/",
        () => page.getByRole("combobox", { name: /language|idioma/i }).selectOption("en")
      );
    await journeyExpect(
      page.getByRole("heading", { name: "Activa la organizacion al confirmar el correo." })
    ).toBeVisible();
    await journeyExpect(page.getByText(new RegExp(identity.email, "i"))).toBeVisible();
    await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "verify delivered email");

    recordJourneyEvent(journeyTrace, startedAt, "sign in", "started");
    await test.step("sign in with the verified owner", async () => {
    await page.goto("/sign-in");
    await page.getByLabel("Correo electronico").fill(identity.email);
    await page.locator("#sign-in-password").fill(identity.password);
      const signInResponse = await performApiAction(
      page,
      "POST",
      "/api/v1/auth/sign-in/",
      () => page.getByRole("button", { name: "Ingresar" }).click()
      );
      const session = (await signInResponse.json()) as Partial<{
        membership: { organizationId: string };
      }>;
      const organizationId = session.membership?.organizationId ?? "";
      expect(organizationId).toMatch(/^[0-9a-f-]{36}$/i);
      evidence.organizationRef = safeReference(organizationId);
    await journeyExpect(page).toHaveURL(/\/my-work$/);
    await journeyExpect(page.getByRole("heading", { name: "Mi trabajo" })).toBeVisible();
    await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "sign in");

    recordJourneyEvent(journeyTrace, startedAt, "design workflow", "started");
    await test.step("create and design the first workflow", async () => {
    await page.getByRole("link", { name: "Crear flujo" }).click();
    await journeyExpect(page).toHaveURL(/\/my-work\/workflows\/new$/);
    await page.getByLabel(/workflow name|nombre del flujo/i).fill(workflowName);
    await performApiAction(
      page,
      "POST",
      "/api/v1/workflow-design/workflows/",
      () => page.getByRole("button", { name: "Crear flujo" }).click()
    );
    await journeyExpect(
      page.getByRole("heading", { name: /Dise.*Inicio, Tarea y Fin/ })
    ).toBeVisible();

    await page.getByRole("button", { name: "Agregar Start" }).click();
    await page.getByRole("button", { name: "Agregar Task" }).click();
    await page.getByRole("button", { name: "Agregar End" }).click();
    await page.getByRole("button", { name: "Conectar Start con Task" }).click();
    await page.getByRole("button", { name: "Conectar Task con End" }).click();
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "design workflow");

    recordJourneyEvent(journeyTrace, startedAt, "repair and publish", "started");
    await test.step("repair publication blockers and publish", async () => {
    const validationPath =
      /\/api\/v1\/workflow-design\/workflows\/[^/]+\/publication-validation\/$/;
    await performApiAction(
      page,
      "POST",
      validationPath,
      () => page.getByRole("button", { name: "Validar publicacion" }).click()
    );
    await journeyExpect(page.getByText(/define quien puede iniciar este flujo/i)).toBeVisible();
    await journeyExpect(page.getByText(/define quien recibe la primera tarea/i)).toBeVisible();
      await assertNoAccessibilityViolations(page, axePath);

    await page.getByRole("radio", { name: "Todas las personas activas" }).check();
    await page.getByRole("radio", { name: "Quien inicia el flujo" }).check();
    await page.getByLabel("Label").fill("Nombre del caso");
    await page.getByRole("button", { name: "Crear Short text" }).click();
    await page.getByRole("button", { name: "Add to first task" }).click();
    await performApiAction(
      page,
      "POST",
      validationPath,
      () => page.getByRole("button", { name: "Validar publicacion" }).click()
    );
    await waitForWorkflowPublicationReady(page);
    await performApiAction(
      page,
      "POST",
      /\/api\/v1\/workflow-design\/workflows\/[^/]+\/publish\/$/,
      () => page.getByRole("button", { name: "Publicar version" }).click()
    );
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "repair and publish");

    recordJourneyEvent(journeyTrace, startedAt, "start process", "started");
    await test.step("start the published workflow", async () => {
    await page.goto("/my-work");
    await journeyExpect(page.getByRole("heading", { name: "Mi trabajo" })).toBeVisible();
    const startRegion = page.getByRole("region", { name: "Iniciar un proceso" });
    const workflowCard = startRegion.getByRole("article").filter({
      has: page.getByRole("heading", { name: workflowName, exact: true })
    });
    await journeyExpect(workflowCard).toHaveCount(1);
    await performApiAction(
      page,
      "POST",
      /\/api\/v1\/my-work\/start-workflows\/[^/]+\/start\/$/,
      () => workflowCard.getByRole("button", { name: "Iniciar" }).click()
    );
    await journeyExpect(page).toHaveURL(/\/my-work\/tasks\/[^/]+$/);
    await journeyExpect(page.getByRole("heading", { name: "Tarea" })).toBeVisible();
    const taskUrl = new URL(page.url());
    taskReference = safeReference(taskUrl.pathname.split("/").at(-1) ?? "");
      evidence.taskRef = taskReference;
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "start process");

    recordJourneyEvent(journeyTrace, startedAt, "save and complete task", "started");
    await test.step("save and complete the assigned task", async () => {
    await page.getByRole("textbox", { name: "Nombre del caso" }).fill(
      "Caso sintetico autorizado"
    );
    await performApiAction(
      page,
      "PUT",
      /\/api\/v1\/my-work\/tasks\/[^/]+\/form\/$/,
      () => page.getByRole("button", { name: "Guardar borrador" }).click()
    );
    await journeyExpect(
      page.getByText("El servidor guardo el avance autorizado.")
    ).toBeVisible();
    await performApiAction(
      page,
      "POST",
      /\/api\/v1\/my-work\/tasks\/[^/]+\/complete\/$/,
      () => page.getByRole("button", { name: "Completar tarea" }).click()
    );
    await journeyExpect(
      page.getByText("La tarea quedo completa y el proceso llego a su fin.")
    ).toBeVisible();
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "save and complete task");

    recordJourneyEvent(journeyTrace, startedAt, "inspect timeline", "started");
    await test.step("inspect the completed process timeline", async () => {
    await page.goto("/my-work");
    const processNavigation = page.getByRole("navigation", {
      name: "Navegacion de regiones de Mi trabajo"
    });
    await processNavigation.getByRole("link", { name: "Mis procesos" }).click();

    const processRegion = page.getByRole("region", { name: "Mis procesos" });
    const processCard = processRegion.getByRole("article").filter({
      has: page.getByRole("heading", { name: workflowName, exact: true })
    });
    await journeyExpect(processCard).toHaveCount(1);
    await performApiAction(
      page,
      "GET",
      /\/api\/v1\/my-work\/processes\/[^/]+\/$/,
      () => processCard.getByRole("link", { name: "Ver proceso" }).click()
    );
    await journeyExpect(
      page.getByRole("heading", { name: workflowName, exact: true })
    ).toBeVisible();

    const timeline = page.getByRole("region", { name: "Linea de tiempo" });
    await journeyExpect(timeline).toBeVisible();
    await journeyExpect(timeline.getByRole("listitem")).toHaveCount(4);
    await journeyExpect(timeline.getByText("Process started")).toBeVisible();
    await journeyExpect(timeline.getByText("Task progress saved")).toBeVisible();
    await journeyExpect(timeline.getByText("Task completed")).toBeVisible();
    await journeyExpect(timeline.getByText("Process completed")).toBeVisible();
      await assertNoAccessibilityViolations(page, axePath);

    const processUrl = new URL(page.url());
      evidence.processRef = safeReference(processUrl.pathname.split("/").at(-1) ?? "");
    });
    recordJourneyEvent(journeyTrace, startedAt, "inspect timeline");
  } catch (error) {
    journeyError = error;
    recordJourneyEvent(journeyTrace, startedAt, "journey", "failed");
    throw error;
  } finally {
    let cleanupError: unknown;
    if (runToken) {
      try {
        await rotateSyntheticJourneyRun(request, { runToken, syntheticKey });
        recordJourneyEvent(journeyTrace, startedAt, "rotate synthetic identity");
      } catch (error) {
        cleanupError = error;
        recordJourneyEvent(journeyTrace, startedAt, "rotate synthetic identity", "failed");
      }
    }
    evidence.durationMs = Date.now() - startedAt;
    await attachJourneyEvidence(page, testInfo, evidence, journeyTrace);
    if (cleanupError && !journeyError) {
      throw cleanupError;
    }
  }
});
