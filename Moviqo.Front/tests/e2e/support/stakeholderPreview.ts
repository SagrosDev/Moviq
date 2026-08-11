export type PreviewLanguage = "en" | "es";

export type PreviewQualificationProfile = {
  deviceName: string;
  fullAuthoring: boolean;
  id: "desktop-authoring" | "mobile-participant";
  languages: readonly PreviewLanguage[];
  viewport: {
    height: number;
    width: number;
  };
};

export type PreviewQualificationEvidence = {
  accessibilityClaim: "baseline-verification-only";
  browserName: string;
  browserVersion: string;
  fullAuthoring: boolean;
  interfaceLanguage: PreviewLanguage;
  profileId: PreviewQualificationProfile["id"];
  projectName: string;
  reducedMotion: "no-preference" | "reduce";
  textScalePercent: 100 | 200;
  viewport: PreviewQualificationProfile["viewport"];
};

export const accessibilityBaselineChecks = [
  "headings-and-labels",
  "focus-order-and-visibility",
  "validation-association",
  "live-announcements",
  "contrast-tokens",
  "reduced-motion",
  "practical-touch-targets",
  "text-scale-200-percent"
] as const;

export const manualKeyboardWalkthroughRoutes = [
  "registration",
  "sign-in",
  "workflow-authoring",
  "task-form",
  "process-timeline"
] as const;

export const previewQualificationProfiles: readonly PreviewQualificationProfile[] = [
  {
    deviceName: "Desktop Chrome",
    fullAuthoring: true,
    id: "desktop-authoring",
    languages: ["es", "en"],
    viewport: { height: 720, width: 1280 }
  },
  {
    deviceName: "Pixel 5",
    fullAuthoring: false,
    id: "mobile-participant",
    languages: ["es", "en"],
    viewport: { height: 844, width: 390 }
  }
] as const;

type CreatePreviewQualificationEvidenceOptions = {
  browserName: string;
  browserVersion: string;
  interfaceLanguage: PreviewLanguage;
  profile: PreviewQualificationProfile;
  projectName: string;
  reducedMotion: PreviewQualificationEvidence["reducedMotion"];
  textScalePercent: PreviewQualificationEvidence["textScalePercent"];
};

export const createPreviewQualificationEvidence = ({
  browserName,
  browserVersion,
  interfaceLanguage,
  profile,
  projectName,
  reducedMotion,
  textScalePercent
}: CreatePreviewQualificationEvidenceOptions): PreviewQualificationEvidence => ({
  accessibilityClaim: "baseline-verification-only",
  browserName,
  browserVersion,
  fullAuthoring: profile.fullAuthoring,
  interfaceLanguage,
  profileId: profile.id,
  projectName,
  reducedMotion,
  textScalePercent,
  viewport: profile.viewport
});

export const previewProfileById = (id: PreviewQualificationProfile["id"]) => {
  const profile = previewQualificationProfiles.find((candidate) => candidate.id === id);
  if (!profile) {
    throw new Error(`Unknown preview qualification profile: ${id}`);
  }
  return profile;
};
