import assert from "node:assert/strict";
import { test } from "node:test";
import { translate } from "../../src/shared/localization";
import {
  accessibilityBaselineChecks,
  createPreviewQualificationEvidence,
  manualKeyboardWalkthroughRoutes,
  previewQualificationProfiles
} from "../e2e/support/stakeholderPreview";

test("preview profiles separate supported desktop authoring from mobile participation", () => {
  assert.deepEqual(
    previewQualificationProfiles.map((profile) => profile.id),
    ["desktop-authoring", "mobile-participant"]
  );

  const desktop = previewQualificationProfiles[0];
  assert.ok(desktop.viewport.width >= 1280);
  assert.ok(desktop.viewport.height >= 720);
  assert.equal(desktop.fullAuthoring, true);
  assert.deepEqual(desktop.languages, ["es", "en"]);

  const mobile = previewQualificationProfiles[1];
  assert.equal(mobile.fullAuthoring, false);
  assert.deepEqual(mobile.languages, ["es", "en"]);
});

test("preview evidence names the actual qualification context without a conformance claim", () => {
  const evidence = createPreviewQualificationEvidence({
    browserName: "chromium",
    browserVersion: "140.0.0.0",
    interfaceLanguage: "en",
    profile: previewQualificationProfiles[1],
    projectName: "preview-mobile-en",
    reducedMotion: "reduce",
    textScalePercent: 200
  });

  assert.deepEqual(evidence, {
    accessibilityClaim: "baseline-verification-only",
    browserName: "chromium",
    browserVersion: "140.0.0.0",
    fullAuthoring: false,
    interfaceLanguage: "en",
    profileId: "mobile-participant",
    projectName: "preview-mobile-en",
    reducedMotion: "reduce",
    textScalePercent: 200,
    viewport: { height: 844, width: 390 }
  });
});

test("accessibility qualification keeps automated and manual baseline scope explicit", () => {
  assert.deepEqual(accessibilityBaselineChecks, [
    "headings-and-labels",
    "focus-order-and-visibility",
    "validation-association",
    "live-announcements",
    "contrast-tokens",
    "reduced-motion",
    "practical-touch-targets",
    "text-scale-200-percent"
  ]);
  assert.deepEqual(manualKeyboardWalkthroughRoutes, [
    "registration",
    "sign-in",
    "workflow-authoring",
    "task-form",
    "process-timeline"
  ]);
});

test("Spanish preview copy localizes owned authoring controls and timeline events", () => {
  assert.equal(translate("es", "workflowDesign.editor.addStart"), "Agregar Inicio");
  assert.equal(translate("es", "workflowDesign.editor.addTask"), "Agregar Tarea");
  assert.equal(translate("es", "workflowDesign.editor.fieldLabel"), "Etiqueta");
  assert.equal(
    translate("es", "workflowDesign.editor.addToFirstTask"),
    "Agregar a la primera tarea"
  );
  assert.equal(
    translate("es", "processDetail.event.taskProgressSaved"),
    "Avance de tarea guardado"
  );
});
