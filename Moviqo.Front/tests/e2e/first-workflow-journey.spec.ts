import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import {
  translate,
  type Language,
  type MessageKey
} from "../../src/shared/localization";
import {
  assertNoAccessibilityViolations,
  attachJourneyEvidence,
  clearSyntheticVerificationLink,
  createSyntheticJourneyRun,
  createSyntheticIdentity,
  deployedJourneyTimeoutMs,
  expectApiOk,
  openSyntheticVerificationLink,
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
import {
  createPreviewQualificationEvidence,
  previewProfileById
} from "./support/stakeholderPreview";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const journeyExpect = expect.configure({ timeout: 15_000 });
const journeyCopy = (language: Language, key: MessageKey) => translate(language, key);

const journeyLanguageFromProject = (metadata: Record<string, unknown>): Language => {
  const language = metadata.interfaceLanguage;
  if (language !== "es" && language !== "en") {
    throw new Error("The deployed journey project must declare an interface language.");
  }
  return language;
};

test("deployed first workflow journey covers registration through completed timeline", async (
  {
    browser,
    browserName,
    page,
    request
  },
  testInfo
) => {
  test.setTimeout(deployedJourneyTimeoutMs);

  const startedAt = Date.now();
  const syntheticKey = readRequiredEnvironment("MOVIQO_E2E_SYNTHETIC_KEY");
  const baseUrl = readRequiredEnvironment("MOVIQO_E2E_BASE_URL");
  const buildId = process.env.MOVIQO_E2E_BUILD_ID ?? "local-e2e";
  const identity = createSyntheticIdentity();
  const language = journeyLanguageFromProject(testInfo.project.metadata);
  const copy = (key: MessageKey) => journeyCopy(language, key);
  const workflowName = `Primer flujo / First workflow ${identity.runId}`;
  const fieldLabel = `Referencia / Reference ${identity.runId}`;
  const journeyTrace: JourneyTraceEvent[] = [];
  const evidence = {
    buildId,
    durationMs: 0,
    host: new URL(baseUrl).host,
    organizationRef: "",
    processRef: "",
    qualification: createPreviewQualificationEvidence({
      browserName,
      browserVersion: browser.version(),
      interfaceLanguage: language,
      profile: previewProfileById("desktop-authoring"),
      projectName: testInfo.project.name,
      reducedMotion: "no-preference",
      textScalePercent: 100
    }),
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
    await page.goto(`/?lang=${language}`);
    await journeyExpect(page.getByRole("combobox", { name: /language|idioma/i })).toHaveValue(language);
    const registrationLink = page
      .getByRole("link", { name: copy("home.cta.register") })
      .first();
    await journeyExpect(registrationLink).toBeVisible();
    await registrationLink.click();

    await journeyExpect(
      page.getByRole("heading", {
        name: copy("registration.title")
      })
    ).toBeVisible();
    await page.getByLabel(copy("registration.ownerName.label")).fill(identity.ownerName);
    await page.getByLabel(copy("registration.organizationName.label")).fill(identity.organizationName);
    await page.getByLabel(copy("registration.email.label")).fill(identity.email);
    await page.locator("#registration-password").fill(identity.password);
    await page.getByLabel(copy("registration.region.label")).fill("CO");
    await page.getByLabel(copy("registration.timezone.label")).fill("America/Bogota");
    await page.getByLabel(copy("registration.currency.label")).fill("COP");
    await page.getByLabel(copy("registration.terms.label")).check();
    await page.getByLabel(copy("registration.privacy.label")).check();
    await page.getByLabel(copy("registration.prohibited.label")).check();
    await performApiAction(
      page,
      "POST",
      "/api/v1/organizations/registrations/",
      () => page.getByRole("button", { name: copy("registration.submit") }).click()
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
      try {
        await performApiAction(
          page,
          "POST",
          "/api/v1/organizations/registrations/verify-email/",
          () => openSyntheticVerificationLink(page, verificationToken)
        );
        await journeyExpect(
          page.getByRole("heading", { name: copy("verification.success.title") })
        ).toBeVisible();
        await journeyExpect(page.getByText(new RegExp(identity.email, "i"))).toBeVisible();
        await clearSyntheticVerificationLink(page);
        await assertNoAccessibilityViolations(page, axePath);
      } finally {
        await clearSyntheticVerificationLink(page);
      }
    });
    recordJourneyEvent(journeyTrace, startedAt, "verify delivered email");

    recordJourneyEvent(journeyTrace, startedAt, "sign in", "started");
    await test.step("sign in with the verified owner", async () => {
      await page.goto(`/sign-in?lang=${language}`);
      await page.getByLabel(copy("signIn.email")).fill(identity.email);
      await page.locator("#sign-in-password").fill(identity.password);
      await performApiAction(
        page,
        "POST",
        "/api/v1/auth/sign-in/",
        () => page.getByRole("button", { name: copy("signIn.submit") }).click()
      );
      await journeyExpect(page).toHaveURL(/\/my-work$/);
      await journeyExpect(page.getByRole("heading", { name: copy("myWork.title") })).toBeVisible();
      const sessionResponse = await page.request.get("/api/v1/auth/session/");
      await expectApiOk(sessionResponse);
      const session = (await sessionResponse.json()) as Partial<{
        membership: { organizationId: string };
      }>;
      const organizationId = session.membership?.organizationId ?? "";
      expect(organizationId).toMatch(/^[0-9a-f-]{36}$/i);
      evidence.organizationRef = safeReference(organizationId);
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "sign in");

    recordJourneyEvent(journeyTrace, startedAt, "design workflow", "started");
    await test.step("create and design the first workflow", async () => {
    await page.getByRole("link", { name: copy("workflowDesign.create.cta") }).click();
    await journeyExpect(page).toHaveURL(/\/my-work\/workflows\/new$/);
    await page.getByLabel(/workflow name|nombre del flujo/i).fill(workflowName);
    await performApiAction(
      page,
      "POST",
      "/api/v1/workflow-design/workflows/",
      () => page.getByRole("button", { name: "Crear flujo" }).click()
    );
    await journeyExpect(
      page.getByRole("heading", { name: copy("workflowDesign.editor.title") })
    ).toBeVisible();

    await page.getByRole("button", { name: copy("workflowDesign.editor.addStart") }).click();
    await page.getByRole("button", { name: copy("workflowDesign.editor.addTask") }).click();
    await page.getByRole("button", { name: copy("workflowDesign.editor.addEnd") }).click();
    await page.getByRole("button", { name: copy("workflowDesign.editor.connectStartTask") }).click();
    await page.getByRole("button", { name: copy("workflowDesign.editor.connectTaskEnd") }).click();
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
      () => page.getByRole("button", { name: copy("workflowDesign.editor.validatePublication") }).click()
    );
    await journeyExpect(page.getByText(copy("workflowDesign.editor.issue.starterMissing"))).toBeVisible();
    await journeyExpect(page.getByText(copy("workflowDesign.editor.issue.assignmentMissing"))).toBeVisible();
      await assertNoAccessibilityViolations(page, axePath);

    await page.getByRole("radio", { name: copy("workflowDesign.editor.starterAllActiveMembers") }).check();
    await page.getByRole("radio", { name: copy("workflowDesign.editor.assignmentWorkflowInitiator") }).check();
    await page.getByLabel(copy("workflowDesign.editor.fieldLabel")).fill(fieldLabel);
    await page.getByRole("button", { name: copy("workflowDesign.editor.addShortText") }).click();
    await page.getByRole("button", { name: copy("workflowDesign.editor.addToFirstTask") }).click();
    await performApiAction(
      page,
      "POST",
      validationPath,
      () => page.getByRole("button", { name: copy("workflowDesign.editor.validatePublication") }).click()
    );
    await waitForWorkflowPublicationReady(page, {
      assignmentIssue: copy("workflowDesign.editor.issue.assignmentMissing"),
      publishButton: copy("workflowDesign.editor.publishWorkflow"),
      starterIssue: copy("workflowDesign.editor.issue.starterMissing")
    });
    await performApiAction(
      page,
      "POST",
      /\/api\/v1\/workflow-design\/workflows\/[^/]+\/publish\/$/,
      () => page.getByRole("button", { name: copy("workflowDesign.editor.publishWorkflow") }).click()
    );
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "repair and publish");

    recordJourneyEvent(journeyTrace, startedAt, "start process", "started");
    await test.step("start the published workflow", async () => {
    await page.goto("/my-work");
    await journeyExpect(page.getByRole("heading", { name: copy("myWork.title") })).toBeVisible();
    const startRegion = page.getByRole("region", { name: copy("myWork.startWorkflows.title") });
    const workflowCard = startRegion.getByRole("article").filter({
      has: page.getByRole("heading", { name: workflowName, exact: true })
    });
    await journeyExpect(workflowCard).toHaveCount(1);
    await performApiAction(
      page,
      "POST",
      /\/api\/v1\/my-work\/start-workflows\/[^/]+\/start\/$/,
      () => workflowCard.getByRole("button", { name: copy("myWork.startWorkflows.start") }).click()
    );
    await journeyExpect(page).toHaveURL(/\/my-work\/tasks\/[^/]+$/);
    await journeyExpect(page.getByRole("heading", { name: copy("workflowDesign.editor.taskLabel") })).toBeVisible();
    const taskUrl = new URL(page.url());
    taskReference = safeReference(taskUrl.pathname.split("/").at(-1) ?? "");
      evidence.taskRef = taskReference;
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "start process");

    recordJourneyEvent(journeyTrace, startedAt, "save and complete task", "started");
    await test.step("save and complete the assigned task", async () => {
    await page.getByRole("textbox", { name: fieldLabel }).fill(
      "Synthetic authorized case"
    );
    await performApiAction(
      page,
      "PUT",
      /\/api\/v1\/my-work\/tasks\/[^/]+\/form\/$/,
      () => page.getByRole("button", { name: copy("taskForm.save") }).click()
    );
    await journeyExpect(
      page.getByText(copy("taskForm.saveSuccess"))
    ).toBeVisible();
    await performApiAction(
      page,
      "POST",
      /\/api\/v1\/my-work\/tasks\/[^/]+\/complete\/$/,
      () => page.getByRole("button", { name: copy("taskForm.complete") }).click()
    );
    await journeyExpect(
      page.getByText(copy("taskForm.completeSuccess"))
    ).toBeVisible();
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "save and complete task");

    recordJourneyEvent(journeyTrace, startedAt, "inspect timeline", "started");
    await test.step("inspect the completed process timeline", async () => {
    await page.goto("/my-work");
    const processNavigation = page.getByRole("navigation", {
      name: copy("myWork.regionNav")
    });
    await processNavigation.getByRole("link", { name: copy("myWork.myProcesses.title") }).click();

    const processRegion = page.getByRole("region", { name: copy("myWork.myProcesses.title") });
    const processCard = processRegion.getByRole("article").filter({
      has: page.getByRole("heading", { name: workflowName, exact: true })
    });
    await journeyExpect(processCard).toHaveCount(1);
    await performApiAction(
      page,
      "GET",
      /\/api\/v1\/my-work\/processes\/[^/]+\/$/,
      () => processCard.getByRole("link", { name: copy("myWork.myProcesses.view") }).click()
    );
    await journeyExpect(
      page.getByRole("heading", { name: workflowName, exact: true })
    ).toBeVisible();

    const timeline = page.getByRole("region", { name: copy("processDetail.timelineTitle") });
    await journeyExpect(timeline).toBeVisible();
    await journeyExpect(timeline.getByRole("listitem")).toHaveCount(4);
    await journeyExpect(timeline.getByText(copy("processDetail.event.processStarted"))).toBeVisible();
    await journeyExpect(timeline.getByText(copy("processDetail.event.taskProgressSaved"))).toBeVisible();
    await journeyExpect(timeline.getByText(copy("processDetail.event.taskCompleted"))).toBeVisible();
    await journeyExpect(timeline.getByText(copy("processDetail.event.processCompleted"))).toBeVisible();
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
