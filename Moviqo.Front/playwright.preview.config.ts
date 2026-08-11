import { defineConfig, devices, type Project } from "@playwright/test";
import {
  previewQualificationProfiles,
  type PreviewLanguage
} from "./tests/e2e/support/stakeholderPreview";

const localeByLanguage: Record<PreviewLanguage, string> = {
  en: "en-US",
  es: "es-CO"
};

const previewProjects: Project[] = previewQualificationProfiles.flatMap((profile) =>
  profile.languages.map((language) => ({
    name: `preview-${profile.id}-${language}`,
    metadata: {
      accessibilityClaim: "baseline-verification-only",
      fullAuthoring: profile.fullAuthoring,
      interfaceLanguage: language,
      previewProfileId: profile.id
    },
    use: {
      ...devices[profile.deviceName],
      locale: localeByLanguage[language],
      reducedMotion: "reduce" as const,
      viewport: profile.viewport
    }
  }))
);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /stakeholder-preview-qualification\.spec\.ts$/,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI
  },
  projects: previewProjects
});
