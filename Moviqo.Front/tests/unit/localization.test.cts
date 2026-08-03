import assert from "node:assert/strict";
import { test } from "node:test";
import {
  designerAuthoredText,
  createLocalLanguagePreferenceAdapter,
  languagePreferenceStorageKey,
  memoryLanguagePreferenceAdapter,
  renderDesignerAuthoredText,
  resolveInitialLanguage,
  translate
} from "../../src/shared/localization";

test("Spanish is the default language and English browser preference is honored", () => {
  assert.equal(resolveInitialLanguage(null, []), "es");
  assert.equal(resolveInitialLanguage(null, ["en-US", "es-CO"]), "en");
});

test("saved language preference wins over browser preference", () => {
  assert.equal(resolveInitialLanguage("es", ["en-US"]), "es");
  assert.equal(resolveInitialLanguage("en", ["es-CO"]), "en");
});

test("Moviqo-owned labels, navigation, statuses, validation, help, and catalog copy localize", () => {
  assert.equal(translate("es", "app.nav.work"), "Mi trabajo");
  assert.equal(translate("en", "app.nav.work"), "My work");
  assert.equal(
    translate("es", "environment.banner.title"),
    "Entorno interno con datos sinteticos"
  );
  assert.equal(
    translate("en", "environment.banner.rule2"),
    "Do not enter real business data, real personal data, or production files."
  );
  assert.equal(translate("es", "status.needsAttention"), "Necesita atencion");
  assert.equal(translate("en", "status.needsAttention"), "Needs attention");
  assert.equal(translate("es", "validation.required"), "Completa este campo para continuar.");
  assert.equal(translate("en", "help.requiredField"), "Use a short and clear description.");
  assert.equal(translate("es", "catalog.task.title"), "Tarjeta de tarea");
  assert.equal(translate("en", "catalog.task.title"), "Task card");
});

test("missing English resources fall back to Spanish instead of internal keys", () => {
  assert.equal(translate("en", "catalog.fallbackOnly"), "Texto de respaldo en espanol");
});

test("language preference adapter persists supported languages through isolated storage key", () => {
  const adapter = memoryLanguagePreferenceAdapter();
  assert.equal(adapter.read(), null);

  adapter.write("en");

  assert.equal(adapter.read(), "en");
  assert.equal(languagePreferenceStorageKey, "moviqo.language");
});

test("local language storage falls back when browser storage throws", () => {
  const adapter = createLocalLanguagePreferenceAdapter({
    getItem: () => {
      throw new Error("storage unavailable");
    },
    setItem: () => {
      throw new Error("storage unavailable");
    }
  });

  assert.equal(adapter.read(), null);
  assert.doesNotThrow(() => adapter.write("en"));
});

test("Designer-authored content bypasses Moviqo-owned translation keys", () => {
  const designerLabel = designerAuthoredText("Aprobacion final del cliente");

  assert.equal(renderDesignerAuthoredText(designerLabel), "Aprobacion final del cliente");
  assert.notEqual(renderDesignerAuthoredText(designerLabel), translate("en", "catalog.workflow.name"));
});
