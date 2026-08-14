import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  designerAuthoredText,
  createLocalLanguagePreferenceAdapter,
  LanguageProvider,
  LanguageSelector,
  languagePreferenceStorageKey,
  memoryLanguagePreferenceAdapter,
  renderDesignerAuthoredText,
  resolveLanguagePopupKey,
  resolveInitialLanguage,
  translate
} from "../../src/shared/localization";

test("language selector renders a compact popup trigger without focus decoration", () => {
  const markup = renderToStaticMarkup(
    createElement(LanguageProvider, {
      adapter: memoryLanguagePreferenceAdapter("es"),
      browserLanguages: ["es-CO"],
      children: createElement(LanguageSelector)
    })
  );

  assert.match(markup, /aria-label="Idioma: Espa(?:ñ|Ã±)ol"/);
  assert.match(markup, /rounded-moviqo-pill/);
  assert.match(markup, /aria-haspopup="listbox"/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /aria-controls="[^"]+-listbox"/);
  assert.match(markup, /data-language-trigger="true"/);
  assert.match(markup, /focus:outline-none/);
  assert.doesNotMatch(markup, /focus-within:/);
  assert.doesNotMatch(markup, /<select/);
  assert.equal((markup.match(/<svg/g) ?? []).length, 2);
  assert.match(markup, /min-h-11/);
});

test("language popup keyboard commands cover open, navigation, selection, and close", () => {
  assert.deepEqual(resolveLanguagePopupKey("Enter", false, 0, 2), { type: "open", index: 0 });
  assert.deepEqual(resolveLanguagePopupKey(" ", true, 1, 2), { type: "select", index: 1 });
  assert.deepEqual(resolveLanguagePopupKey("ArrowDown", true, 1, 2), { type: "navigate", index: 0 });
  assert.deepEqual(resolveLanguagePopupKey("ArrowUp", true, 0, 2), { type: "navigate", index: 1 });
  assert.deepEqual(resolveLanguagePopupKey("Escape", true, 0, 2), { type: "close" });
});

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
    "Entorno interno con datos sintéticos"
  );
  assert.equal(
    translate("en", "environment.banner.rule2"),
    "Do not enter real business data, real personal data, or production files."
  );
  assert.equal(translate("es", "status.needsAttention"), "Necesita atención");
  assert.equal(translate("en", "status.needsAttention"), "Needs attention");
  assert.equal(translate("es", "status.active"), "Activo");
  assert.equal(translate("en", "status.active"), "Active");
  assert.equal(translate("es", "validation.required"), "Completa este campo para continuar.");
  assert.equal(translate("en", "help.requiredField"), "Use a short and clear description.");
  assert.equal(translate("es", "catalog.task.title"), "Tarjeta de tarea");
  assert.equal(translate("en", "catalog.task.title"), "Task card");
  assert.equal(
    translate("es", "myWork.permissionDenied"),
    "No tienes permiso para ver este trabajo. Tu sesión sigue activa."
  );
  assert.equal(
    translate("es", "myWork.startWorkflows.emptyAuthor"),
    "Crea un flujo para iniciar"
  );
  assert.equal(translate("es", "formLauncher.noWorkflows"), "Aún no tienes formularios");
  assert.equal(translate("es", "app.nav.dashboard"), "Mi trabajo");
  assert.equal(translate("en", "app.nav.dashboard"), "My work");
  assert.equal(
    translate("es", "formDesign.addAccepted"),
    "El elemento se agregó y está seleccionado. Revisa sus propiedades."
  );
  assert.equal(
    translate("en", "formDesign.addAccepted"),
    "The item was added and selected. Review its properties."
  );
  assert.equal(translate("es", "taskForm.viewProcess"), "Ver línea de tiempo");
  assert.equal(translate("en", "taskForm.viewProcess"), "View process timeline");
  assert.equal(translate("es", "taskForm.viewWork"), "Ver Mi trabajo");
  assert.equal(translate("en", "taskForm.viewWork"), "View My work");
  assert.equal(
    translate("es", "taskForm.taskCompleteHandoff"),
    "El proceso continúa con la siguiente tarea. Revisa Mi trabajo para ver si tienes alguna tarea asignada."
  );
  assert.equal(
    translate("en", "taskForm.taskCompleteHandoff"),
    "The process continues with its next task. Review My work for any task assigned to you."
  );
  assert.equal(
    translate("es", "myWork.startWorkflows.pageLede"),
    "Elige un flujo publicado para iniciar un proceso nuevo."
  );
  assert.equal(
    translate("en", "myWork.myProcesses.loading"),
    "Loading your processes."
  );
  assert.equal(
    translate("en", "myWork.permissionDenied"),
    "You do not have permission to view this work. Your session remains active."
  );
  assert.equal(
    translate("es", "password.policy.helper"),
    "Usa entre 15 y 128 caracteres. Evita contraseñas comunes o expuestas."
  );
  assert.equal(
    translate("en", "password.policy.reveal"),
    "Show password"
  );
});

test("public and onboarding Spanish copy preserves required spelling and accents", () => {
  const expectedCopy = [
    ["app.language.spanish", "Español"],
    ["environment.banner.title", "Entorno interno con datos sintéticos"],
    ["password.policy.helper", "Usa entre 15 y 128 caracteres. Evita contraseñas comunes o expuestas."],
    ["registration.organization.title", "Organización"],
    ["registration.title", "Registra tu organización y la primera persona responsable."],
    ["verification.eyebrow", "Verificación de correo"],
    ["signIn.email", "Correo electrónico"],
    ["processDetail.timelineTitle", "Línea de tiempo"],
    ["processDetail.actor.authorizedMember", "Miembro autorizado"],
    ["myWork.myProcesses.contribution.initiated", "Iniciaste este proceso."],
    ["taskForm.completeHandoff", "La línea de tiempo del proceso ya está disponible para revisión."],
    ["workflowDesign.editor.addAccepted", "El elemento se agregó y está seleccionado."],
    ["workflowDesign.create.eyebrow", "Diseño de flujos"],
    ["workflowDesign.create.body", "Usa un nombre claro para identificar el flujo. Después podrás agregar las tareas y definir quién participa."],
    ["workflowDesign.editor.title", "Diseña tu flujo de trabajo"],
    ["workflowDesign.editor.canvasTitle", "Lienzo del flujo"],
    ["workflowDesign.editor.saveSuccess", "Cambios guardados"],
    ["passwordRecovery.title", "Recupera tu contraseña"],
    ["passwordRecovery.resetFailure", "El enlace no es válido o la contraseña no cumple la política."]
  ] as const;

  for (const [key, expected] of expectedCopy) {
    assert.equal(translate("es", key), expected);
  }
});

test("reviewed English onboarding copy describes current behavior", () => {
  assert.equal(
    translate("en", "registration.form.body"),
    "Review the language, region, timezone, and currency before sending."
  );
  assert.equal(
    translate("en", "verification.success.next"),
    "Sign in with this verified email to continue."
  );
  assert.equal(translate("en", "workflowDesign.editor.title"), "Design your workflow");
  assert.equal(translate("en", "workflowDesign.editor.canvasTitle"), "Workflow canvas");
  assert.equal(translate("en", "workflowDesign.editor.saveSuccess"), "Changes saved");
  assert.equal(
    translate("en", "taskForm.completeHandoff"),
    "The process timeline is now available for review."
  );
  assert.equal(
    translate("en", "myWork.myProcesses.contribution.completedTask"),
    "You completed one authorized task."
  );
  assert.equal(
    translate("en", "workflowCatalog.error"),
    "We could not load your workflows"
  );
});

test("missing English resources fall back to Spanish instead of internal keys", () => {
  assert.equal(translate("en", "catalog.fallbackOnly"), "Texto de respaldo en español");
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
