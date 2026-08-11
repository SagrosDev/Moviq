import { defineConfig, devices } from "@playwright/test";

const isDeployedJourney = process.env.PLAYWRIGHT_DEPLOYED_JOURNEY === "1";
const resolveLocalHost = (value: string | undefined) => {
  const candidate = value?.trim() || "127.0.0.1";
  const labels = candidate.split(".");
  const isSafeHostname = labels.every((label) => (
    label.length > 0
    && label.length <= 63
    && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)
  ));
  const isIpv4Candidate = labels.length === 4
    && labels.every((label) => /^\d+$/.test(label));
  const isValidIpv4 = labels.length === 4
    && labels.every((label) => /^\d{1,3}$/.test(label) && Number(label) <= 255);
  if (
    candidate.length > 253
    || (isIpv4Candidate ? !isValidIpv4 : !isSafeHostname)
  ) {
    throw new Error("MOVIQO_E2E_HOST must be a valid local hostname or IPv4 address.");
  }
  return candidate;
};

const localHost = resolveLocalHost(process.env.MOVIQO_E2E_HOST);
const localOrigin = new URL(`http://${localHost}:5173`).origin;

const localProjects = [
  {
    name: "chromium-desktop",
    use: { ...devices["Desktop Chrome"] }
  },
  {
    name: "edge-family-desktop",
    use: { ...devices["Desktop Edge"], channel: "chromium" }
  },
  {
    name: "firefox-desktop",
    use: { ...devices["Desktop Firefox"] }
  },
  {
    name: "webkit-desktop",
    use: { ...devices["Desktop Safari"] }
  },
  {
    name: "mobile-chrome",
    use: { ...devices["Pixel 5"] }
  },
  {
    name: "tablet-safari",
    use: { ...devices["iPad Pro 11"] }
  }
];

const ciProjects = [
  {
    name: "chromium-desktop",
    use: { ...devices["Desktop Chrome"] }
  },
  {
    name: "mobile-chrome",
    use: { ...devices["Pixel 5"] }
  }
];

const deployedJourneyProjects = [
  {
    name: "deployed-journey-es",
    testMatch: /first-workflow-journey\.spec\.ts$/,
    metadata: {
      accessibilityClaim: "baseline-verification-only",
      interfaceLanguage: "es",
      previewProfileId: "desktop-authoring"
    },
    use: {
      ...devices["Desktop Chrome"],
      locale: "es-CO",
      viewport: { width: 1280, height: 720 },
      screenshot: "off" as const,
      trace: "off" as const,
      video: "off" as const
    }
  },
  {
    name: "deployed-journey-en",
    testMatch: /first-workflow-journey\.spec\.ts$/,
    metadata: {
      accessibilityClaim: "baseline-verification-only",
      interfaceLanguage: "en",
      previewProfileId: "desktop-authoring"
    },
    use: {
      ...devices["Desktop Chrome"],
      locale: "en-US",
      viewport: { width: 1280, height: 720 },
      screenshot: "off" as const,
      trace: "off" as const,
      video: "off" as const
    }
  }
];

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: isDeployedJourney
    ? undefined
    : /(?:first-workflow-journey|stakeholder-preview-qualification)\.spec\.ts$/,
  workers: 1,
  use: {
    baseURL: process.env.MOVIQO_E2E_BASE_URL ?? localOrigin,
    locale: "es-CO",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: isDeployedJourney
    ? undefined
    : {
        command: `npm run dev -- --host=${localHost}`,
        url: localOrigin,
        reuseExistingServer:
          process.env.MOVIQO_E2E_REUSE_SERVER === "1" || !process.env.CI
      },
  projects: isDeployedJourney
    ? deployedJourneyProjects
    : process.env.CI
      ? ciProjects
      : localProjects
});
