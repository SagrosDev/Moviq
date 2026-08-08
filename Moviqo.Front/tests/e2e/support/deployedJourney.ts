import {
  expect,
  type APIRequestContext,
  type Page,
  type Response,
  type TestInfo
} from "@playwright/test";

type SyntheticIdentity = {
  runId: string;
  ownerName: string;
  organizationName: string;
  organizationReference: string;
  email: string;
  password: string;
};

type SyntheticLinkOptions = {
  email: string;
  syntheticKey: string;
};

type JourneyEvidence = {
  buildId: string;
  durationMs: number;
  host: string;
  organizationRef: string;
  processRef: string;
  taskRef: string;
};

const deployedAssertionTimeoutMs = 15_000;

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
    organizationReference: runId.slice(0, 8),
    email: `owner.${runId}@synthetic.moviqo.test`,
    password: `synthetic safe passphrase ${runId}`
  };
};

export const requestSyntheticVerificationLink = async (
  request: APIRequestContext,
  options: SyntheticLinkOptions
) => {
  const response = await request.post("/api/v1/organizations/testing/synthetic-verification-link/", {
    data: { email: options.email },
    headers: { "X-Moviqo-Synthetic-Key": options.syntheticKey }
  });
  if (!response.ok()) {
    expect(response.ok(), await response.text()).toBe(true);
  }
  const payload = (await response.json()) as { verificationUrl: string };
  return payload.verificationUrl;
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

export const expectApiOk = async (response: Response) => {
  if (response.ok()) {
    return;
  }

  const fallbackMessage = `${response.status()} ${response.statusText()}`.trim();
  let failureMessage = fallbackMessage;
  try {
    failureMessage = (await response.text()).trim() || fallbackMessage;
  } catch {
    failureMessage = `${fallbackMessage}. Response body is unavailable after navigation.`;
  }
  expect(response.ok(), failureMessage).toBe(true);
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

export const attachJourneyEvidence = async (
  testInfo: TestInfo,
  evidence: JourneyEvidence
) => {
  await testInfo.attach("journey-evidence", {
    body: Buffer.from(JSON.stringify(evidence, null, 2), "utf-8"),
    contentType: "application/json"
  });
};
