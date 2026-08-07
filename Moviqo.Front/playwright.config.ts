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
    name: "deployed-journey",
    testMatch: /first-workflow-journey\.spec\.ts$/,
    use: { ...devices["Desktop Chrome"] }
  }
];

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: isDeployedJourney ? undefined : /first-workflow-journey\.spec\.ts$/,
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
