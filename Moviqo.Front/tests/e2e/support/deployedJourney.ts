import { expect, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";

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
  host: string;
  organizationRef: string;
  processRef: string;
  taskRef: string;
};

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
  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as { verificationUrl: string };
  return payload.verificationUrl;
};

export const assertNoAccessibilityViolations = async (page: Page) => {
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
