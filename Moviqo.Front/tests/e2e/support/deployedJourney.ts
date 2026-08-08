import {
  expect,
  type APIRequestContext,
  type APIResponse,
  type Locator,
  type Page,
  type Response,
  type TestInfo
} from "@playwright/test";

type SyntheticIdentity = {
  runId: string;
  ownerName: string;
  organizationName: string;
  email: string;
  password: string;
};

type SyntheticRunOptions = {
  email: string;
  syntheticKey: string;
};

type VerificationLinkOptions = SyntheticRunOptions & {
  baseUrl: string;
  runToken: string;
};

export type JourneyEvidence = {
  buildId: string;
  durationMs: number;
  host: string;
  organizationRef: string;
  processRef: string;
  taskRef: string;
};

export type JourneyTraceEvent = {
  elapsedMs: number;
  stage: string;
  status: "failed" | "passed" | "started";
};

type HttpResponse = APIResponse | Response;

const deployedAssertionTimeoutMs = 15_000;
const syntheticLinkAttempts = 90;
const syntheticLinkPollIntervalMs = 2_000;
export const deployedJourneyTimeoutMs =
  syntheticLinkAttempts * syntheticLinkPollIntervalMs + 240_000;
const safeDiagnostic = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export const readRequiredEnvironment = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const safeReference = (value: string) => value.slice(0, 8);

export const createSyntheticIdentity = (): SyntheticIdentity => {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return {
    runId,
    ownerName: `Owner ${runId}`,
    organizationName: `Org ${runId}`,
    email: `owner.${runId}@synthetic.moviqo.test`,
    password: `synthetic safe passphrase ${runId}`
  };
};

export const verifyDeployedBuild = async (
  request: APIRequestContext,
  expectedBuildId: string
) => {
  const response = await request.get("/api/v1/health/start/");
  await expectApiOk(response);
  const payload = (await response.json()) as Partial<{
    build: string;
    environmentClass: string;
  }>;
  expect(payload.build, "UAT must run the build under test.").toBe(expectedBuildId);
  expect(payload.environmentClass, "The deployed journey must remain synthetic-only.").toBe(
    "synthetic-only"
  );
};

export const createSyntheticJourneyRun = async (
  request: APIRequestContext,
  options: SyntheticRunOptions
) => {
  const response = await request.post("/api/v1/organizations/testing/synthetic-runs/", {
    data: { email: options.email },
    headers: { "X-Moviqo-Synthetic-Key": options.syntheticKey }
  });
  await expectApiOk(response);
  const payload = (await response.json()) as Partial<{ email: string; runToken: string }>;
  expect(payload.email).toBe(options.email);
  expect(typeof payload.runToken).toBe("string");
  expect(payload.runToken?.length ?? 0).toBeGreaterThan(40);
  return payload.runToken as string;
};

export const requestSyntheticVerificationToken = async (
  request: APIRequestContext,
  options: VerificationLinkOptions
) => {
  for (let attempt = 0; attempt < syntheticLinkAttempts; attempt += 1) {
    const response = await request.post(
      "/api/v1/organizations/testing/synthetic-runs/verification-link/",
      {
        data: { runToken: options.runToken },
        headers: { "X-Moviqo-Synthetic-Key": options.syntheticKey }
      }
    );
    if (response.ok()) {
      const payload = (await response.json()) as Partial<{
        email: string;
        verificationUrl: string;
      }>;
      expect(payload.email).toBe(options.email);
      const verificationUrl = new URL(payload.verificationUrl ?? "");
      expect(verificationUrl.origin).toBe(new URL(options.baseUrl).origin);
      expect(verificationUrl.pathname).toBe("/verify-email");
      const verificationToken = verificationUrl.searchParams.get("token") ?? "";
      expect(verificationToken.length).toBeGreaterThan(40);
      return verificationToken;
    }
    if (response.status() !== 404) {
      await expectApiOk(response);
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, syntheticLinkPollIntervalMs);
    });
  }
  throw new Error("Verification email was not delivered within the synthetic journey window.");
};

export const rotateSyntheticJourneyRun = async (
  request: APIRequestContext,
  options: { runToken: string; syntheticKey: string }
) => {
  const response = await request.post(
    "/api/v1/organizations/testing/synthetic-runs/rotate/",
    {
      data: { runToken: options.runToken },
      headers: { "X-Moviqo-Synthetic-Key": options.syntheticKey }
    }
  );
  await expectApiOk(response);
};

const matchesPathname = (pathname: string, expectedPath: RegExp | string) =>
  expectedPath instanceof RegExp ? expectedPath.test(pathname) : pathname === expectedPath;

export const waitForApiResponse = (
  page: Page,
  method: string,
  expectedPath: RegExp | string
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === method &&
      matchesPathname(url.pathname, expectedPath)
    );
  });

const safeFailureMessage = async (response: HttpResponse) => {
  const headers = response.headers();
  let code = "";
  let bodyCorrelationId = "";
  try {
    const payload = (await response.json()) as Partial<{
      code: string;
      correlationId: string;
    }>;
    code = safeDiagnostic.test(payload.code ?? "") ? (payload.code as string) : "";
    bodyCorrelationId = safeDiagnostic.test(payload.correlationId ?? "")
      ? (payload.correlationId as string)
      : "";
  } catch {
    // The response body is deliberately excluded from diagnostics.
  }
  const headerCorrelationId = headers["x-correlation-id"] ?? "";
  const correlationId = bodyCorrelationId ||
    (safeDiagnostic.test(headerCorrelationId) ? headerCorrelationId : "");
  return [
    `Request failed with status ${response.status()}.`,
    code ? `Code: ${code}.` : "",
    correlationId ? `Correlation: ${correlationId}.` : ""
  ].filter(Boolean).join(" ");
};

export const expectApiOk = async (response: HttpResponse) => {
  if (response.ok()) {
    return;
  }
  expect(response.ok(), await safeFailureMessage(response)).toBe(true);
};

export const performApiAction = async (
  page: Page,
  method: string,
  expectedPath: RegExp | string,
  action: () => Promise<unknown>
) => {
  const [response] = await Promise.all([
    waitForApiResponse(page, method, expectedPath),
    action()
  ]);
  await expectApiOk(response);
  return response;
};

export const waitForWorkflowPublicationReady = async (page: Page) => {
  await expect(page.getByText(/define quien puede iniciar este flujo/i)).toHaveCount(0, {
    timeout: deployedAssertionTimeoutMs
  });
  await expect(page.getByText(/define quien recibe la primera tarea/i)).toHaveCount(0, {
    timeout: deployedAssertionTimeoutMs
  });
  await expect(page.getByRole("button", { name: "Publicar version" })).toBeEnabled({
    timeout: deployedAssertionTimeoutMs
  });
};

export const assertNoAccessibilityViolations = async (
  page: Page,
  axePath?: string
) => {
  const axePresent = await page.evaluate(() =>
    Boolean((window as unknown as { axe?: unknown }).axe)
  );

  if (!axePresent) {
    if (!axePath) {
      throw new Error("axePath is required when the current page has not loaded axe.");
    }
    await page.addScriptTag({ path: axePath });
  }

  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import("axe-core") }).axe;
    return axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
      }
    });
  });
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
};

export const recordJourneyEvent = (
  trace: JourneyTraceEvent[],
  startedAt: number,
  stage: string,
  status: JourneyTraceEvent["status"] = "passed"
) => {
  trace.push({ elapsedMs: Date.now() - startedAt, stage, status });
};

const safeScreenshotMasks = (page: Page): Locator[] => [
  page.locator("input"),
  page.locator("textarea"),
  page.locator("[contenteditable='true']")
];

export const attachJourneyEvidence = async (
  page: Page,
  testInfo: TestInfo,
  evidence: JourneyEvidence,
  trace: JourneyTraceEvent[]
) => {
  await testInfo.attach("journey-evidence", {
    body: Buffer.from(JSON.stringify(evidence, null, 2), "utf-8"),
    contentType: "application/json"
  });
  await testInfo.attach("sanitized-journey-trace", {
    body: Buffer.from(JSON.stringify(trace, null, 2), "utf-8"),
    contentType: "application/json"
  });
  if (!page.isClosed()) {
    const screenshot = await page.screenshot({
      animations: "disabled",
      mask: safeScreenshotMasks(page),
      maskColor: "#111111"
    });
    await testInfo.attach("sanitized-final-page", {
      body: screenshot,
      contentType: "image/png"
    });
  }
};
