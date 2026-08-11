import { defineConfig, devices } from "@playwright/test";

const isDeployedJourney = process.env.PLAYWRIGHT_DEPLOYED_JOURNEY === "1";

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
    baseURL: process.env.MOVIQO_E2E_BASE_URL ?? "http://127.0.0.1:5173",
    locale: "es-CO",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: isDeployedJourney
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI
      },
  projects: isDeployedJourney
    ? deployedJourneyProjects
    : process.env.CI
      ? ciProjects
      : localProjects
});
