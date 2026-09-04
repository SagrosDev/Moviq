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
  const buildId = readRequiredEnvironment("MOVIQO_E2E_BUILD_ID");
  const identity = createSyntheticIdentity();
  const language = journeyLanguageFromProject(testInfo.project.metadata);
  const copy = (key: MessageKey) => journeyCopy(language, key);
  const selectedLanguageName = copy(
    language === "en" ? "app.language.english" : "app.language.spanish"
  );
  const workflowName = `Primer flujo / First workflow ${identity.runId}`;
  const taskName = copy("workflowDesign.editor.taskLabel");
  const fieldLabel = `Referencia / Reference ${identity.runId}`;
  const journeyTrace: JourneyTraceEvent[] = [];
  const evidence = {
    buildId,
    durationMs: 0,
    host: "",
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
    const deployedUrl = new URL(baseUrl);
    expect(deployedUrl.href).toBe("https://moviqo-uat-synthetic.web.app/");
    evidence.host = deployedUrl.host;
    await verifyDeployedBuild(request, buildId);
    recordJourneyEvent(journeyTrace, startedAt, "verify deployed build");
    runToken = await createSyntheticJourneyRun(request, {
      email: identity.email,
      syntheticKey
    });

    recordJourneyEvent(journeyTrace, startedAt, "register owner", "started");
    await test.step("register a clean synthetic owner organization", async () => {
    await page.goto(`/?lang=${language}`);
    await journeyExpect(page.getByRole("button", {
      exact: true,
      name: `${copy("app.language.label")}: ${selectedLanguageName}`
    })).toBeVisible();
    const registrationLink = page
      .locator('section[aria-labelledby="landing-title"]')
      .getByRole("link", { name: copy("home.cta.register") });
    await journeyExpect(registrationLink).toBeVisible();
    await registrationLink.click();

    await journeyExpect(
      page.getByRole("heading", {
        exact: true,
        level: 1,
        name: copy("registration.title")
      })
    ).toBeVisible();
    await page.getByLabel(copy("registration.ownerName.label")).fill(identity.ownerName);
    await page.getByLabel(copy("registration.organizationName.label")).fill(identity.organizationName);
    await page.getByLabel(copy("registration.email.label")).fill(identity.email);
    await page.getByLabel(copy("registration.password.label")).fill(identity.password);
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
    await journeyExpect(
      page.getByRole("status").filter({ hasText: identity.email })
    ).toContainText(copy("registration.success"));
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
          page.getByRole("heading", {
            exact: true,
            level: 2,
            name: copy("verification.success.title")
          })
        ).toBeVisible();
        await journeyExpect(page.getByText(identity.email, { exact: true })).toBeVisible();
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
      await page.getByLabel(copy("signIn.password")).fill(identity.password);
      await performApiAction(
        page,
        "POST",
        "/api/v1/auth/sign-in/",
        () => page.getByRole("button", { name: copy("signIn.submit") }).click()
      );
      await journeyExpect(page).toHaveURL(/\/my-work$/);
      await journeyExpect(page.getByRole("heading", {
        exact: true,
        level: 1,
        name: copy("app.nav.dashboard")
      })).toBeVisible();
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
    await page.getByRole("link", { name: copy("app.nav.workflows") }).click();
    await page.getByRole("button", { name: copy("workflowCatalog.create") }).click();
    await journeyExpect(page).toHaveURL(/\/workflows\/new$/);
    await page.getByLabel(copy("workflowDesign.create.name")).fill(workflowName);
    await performApiAction(
      page,
      "POST",
      "/api/v1/workflow-design/workflows/",
      () => page.getByRole("button", { name: copy("workflowDesign.create.submit") }).click()
    );
    await journeyExpect(
      page.getByRole("heading", { exact: true, level: 1, name: workflowName })
    ).toBeVisible();
    await journeyExpect(page).toHaveURL(/\/workflows\/[^/]+\/design$/);

    await page.getByRole("button", { name: copy("workflowDesign.editor.addTask") }).click();
    await page.getByRole("button", { name: copy("workflowDesign.editor.addEnd") }).click();
    await page.locator("#workflow-element-start-1")
      .getByRole("button", { name: copy("workflowDesign.editor.outgoingHandle") })
      .press("Enter");
    await page.locator("#workflow-element-task-1")
      .getByRole("button", { name: copy("workflowDesign.editor.incomingHandle") })
      .press("Enter");
    await page.locator("#workflow-element-task-1")
      .getByRole("button", { name: copy("workflowDesign.editor.outgoingHandle") })
      .press("Enter");
    await page.locator("#workflow-element-end-1")
      .getByRole("button", { name: copy("workflowDesign.editor.incomingHandle") })
      .press("Enter");
    await performApiAction(
      page,
      "PUT",
      /\/api\/v1\/workflow-design\/workflows\/[^/]+\/draft\/$/,
      () => page.getByRole("button", { name: copy("workflowDesign.draft.save") }).click()
    );
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "design workflow");

    recordJourneyEvent(journeyTrace, startedAt, "repair and publish", "started");
    await test.step("repair publication blockers and publish", async () => {
    const [blockedPublicationResponse] = await Promise.all([
      page.waitForResponse((response) => (
        response.request().method() === "POST"
        && /\/api\/v1\/workflow-design\/workflows\/[^/]+\/publish\/$/.test(
          new URL(response.url()).pathname
        )
      )),
      page.getByRole("button", {
        name: copy("workflowDesign.editor.publishWorkflow")
      }).click()
    ]);
    expect(blockedPublicationResponse.status()).toBe(400);
    expect(blockedPublicationResponse.headers()["content-type"]).toContain(
      "application/problem+json"
    );
    const blockedPublicationProblem = await blockedPublicationResponse.json() as Partial<{
      code: string;
      invalidParams: Array<{ code?: string }>;
    }>;
    expect(blockedPublicationProblem.code).toBe("workflow_draft_invalid");
    const blockerCodes = new Set(
      blockedPublicationProblem.invalidParams?.map((invalidParam) => invalidParam.code)
    );
    expect(blockerCodes.has("starter_missing")).toBe(true);
    expect(blockerCodes.has("assignment_missing")).toBe(true);
    expect(blockerCodes.has("task_form_missing")).toBe(true);
    await journeyExpect(page.getByText(copy("workflowDesign.editor.issue.starterMissing"))).toBeVisible();
    await journeyExpect(page.getByText(copy("workflowDesign.editor.issue.assignmentMissing"))).toBeVisible();
    await journeyExpect(page.getByText(copy("workflowDesign.editor.issue.taskFormMissing"))).toBeVisible();
      await assertNoAccessibilityViolations(page, axePath);

    await page.getByLabel(copy("workflowDesign.editor.starterSectionTitle"))
      .selectOption("allActiveMembers");
    await page.getByRole("group", {
      exact: true,
      name: `${taskName}: ${taskName}`
    }).click();
    await page.getByLabel(copy("workflowDesign.editor.taskAssignmentTitle"))
      .selectOption("workflowInitiator");
    await performApiAction(
      page,
      "PUT",
      /\/api\/v1\/workflow-design\/workflows\/[^/]+\/draft\/$/,
      () => page.getByRole("button", { name: copy("workflowDesign.draft.save") }).click()
    );

    await page.getByRole("button", { name: copy("workflowDesign.editor.designForm") }).click();
    await journeyExpect(page).toHaveURL(/\/workflows\/[^/]+\/tasks\/task-1\/form$/);
    await page.getByRole("button", { name: copy("formDesign.shortText") }).click();
    await page.getByLabel(copy("formDesign.label")).fill(fieldLabel);
    await assertNoAccessibilityViolations(page, axePath);
    await performApiAction(
      page,
      "PUT",
      /\/api\/v1\/workflow-design\/workflows\/[^/]+\/tasks\/task-1\/form-draft\/$/,
      () => page.getByRole("button", { name: copy("formDesign.saveAndReturn") }).click()
    );
    await journeyExpect(page).toHaveURL(/\/workflows\/[^/]+\/design\?task=task-1$/);
    await journeyExpect(
      page.getByRole("heading", { exact: true, level: 1, name: workflowName })
    ).toBeVisible();
    await journeyExpect(page.getByLabel(
      copy("workflowDesign.editor.starterSectionTitle")
    )).toHaveValue("allActiveMembers");
    await journeyExpect(page.getByLabel(
      copy("workflowDesign.editor.taskAssignmentTitle")
    )).toHaveValue("workflowInitiator");
    await journeyExpect(page.getByText(
      copy("workflowDesign.editor.formReady"),
      { exact: true }
    )).toBeVisible();
    await journeyExpect(page.getByText(
      copy("workflowDesign.editor.issue.starterMissing")
    )).toHaveCount(0);
    await journeyExpect(page.getByText(
      copy("workflowDesign.editor.issue.assignmentMissing")
    )).toHaveCount(0);
    await journeyExpect(page.getByText(
      copy("workflowDesign.editor.issue.taskFormMissing")
    )).toHaveCount(0);
    await performApiAction(
      page,
      "POST",
      /\/api\/v1\/workflow-design\/workflows\/[^/]+\/publish\/$/,
      () => page.getByRole("button", { name: copy("workflowDesign.editor.publishWorkflow") }).click()
    );
    await journeyExpect(
      page.getByRole("status").filter({
        hasText: copy("workflowDesign.editor.publishSuccess")
      })
    ).toBeVisible();
      await assertNoAccessibilityViolations(page, axePath);
    });
    recordJourneyEvent(journeyTrace, startedAt, "repair and publish");

    recordJourneyEvent(journeyTrace, startedAt, "start process", "started");
    await test.step("start the published workflow", async () => {
    await page.goto("/processes/start");
    await journeyExpect(page.getByRole("heading", { level: 1, name: copy("myWork.startWorkflows.title") })).toBeVisible();
    const startRegion = page.locator(
      "section[aria-labelledby='my-work-startWorkflows-title']"
    );
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
    await journeyExpect(page.getByRole("heading", {
      exact: true,
      level: 1,
      name: taskName
    })).toBeVisible();
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
      await page.getByRole("link", { name: copy("taskForm.viewProcess") }).click();
    });
    recordJourneyEvent(journeyTrace, startedAt, "save and complete task");

    recordJourneyEvent(journeyTrace, startedAt, "inspect timeline", "started");
    await test.step("inspect the completed process timeline", async () => {
    await journeyExpect(page).toHaveURL(/\/my-work\/processes\/[^/]+$/);
    await journeyExpect(
      page.getByRole("heading", { name: workflowName, exact: true })
    ).toBeVisible();
    await journeyExpect(
      page.getByText(copy("status.completed"), { exact: true })
    ).toBeVisible();

    const timeline = page.getByRole("region", { name: copy("processDetail.timelineTitle") });
    await journeyExpect(timeline).toBeVisible();
    await journeyExpect(timeline.getByText(
      copy("processDetail.event.processStarted"),
      { exact: true }
    )).toBeVisible();
    await journeyExpect(timeline.getByText(
      copy("processDetail.event.taskProgressSaved"),
      { exact: true }
    )).toBeVisible();
    await journeyExpect(timeline.getByText(
      copy("processDetail.event.taskCompleted"),
      { exact: true }
    )).toBeVisible();
    await journeyExpect(timeline.getByText(
      copy("processDetail.event.processCompleted"),
      { exact: true }
    )).toBeVisible();
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
