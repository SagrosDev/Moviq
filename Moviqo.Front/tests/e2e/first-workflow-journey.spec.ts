import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import {
  assertNoAccessibilityViolations,
  attachJourneyEvidence,
  createSyntheticIdentity,
  readRequiredEnvironment,
  requestSyntheticVerificationLink,
  safeReference
} from "./support/deployedJourney";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

test("deployed first workflow journey covers registration through completed timeline", async (
  {
    page,
    request
  },
  testInfo
) => {
  const syntheticKey = readRequiredEnvironment("MOVIQO_E2E_SYNTHETIC_KEY");
  const buildId = process.env.MOVIQO_E2E_BUILD_ID ?? "local-e2e";
  const identity = createSyntheticIdentity();

  await page.goto("/");
  await page.getByRole("combobox", { name: /language|idioma/i }).selectOption("es");
  await expect(page.getByRole("link", { name: "Iniciar beta gratuita" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Iniciar beta gratuita" }).first().click();

  await expect(
    page.getByRole("heading", {
      name: "Registra la organizacion y a su primera persona responsable."
    })
  ).toBeVisible();
  await page.getByLabel("Nombre de la persona responsable").fill(identity.ownerName);
  await page.getByLabel("Nombre de la organizacion").fill(identity.organizationName);
  await page.getByLabel("Correo de acceso").fill(identity.email);
  await page.getByLabel("Contrasena").fill(identity.password);
  await page.getByLabel("Region").fill("CO");
  await page.getByLabel("Zona horaria").fill("America/Bogota");
  await page.getByLabel("Moneda").fill("COP");
  await page.getByLabel(/acepto los terminos beta vigentes/i).check();
  await page.getByLabel(/acepto el aviso de privacidad vigente/i).check();
  await page.getByLabel(/no ingresare datos personales reales/i).check();
  await page.getByRole("button", { name: "Enviar registro" }).click();
  await expect(
    page.getByText(`Se envio un enlace de verificacion a ${identity.email}`)
  ).toBeVisible();

  await page.addScriptTag({ path: axePath });
  await assertNoAccessibilityViolations(page);

  const verificationUrl = await requestSyntheticVerificationLink(request, {
    email: identity.email,
    syntheticKey
  });
  await page.goto(verificationUrl);
  await expect(
    page.getByRole("heading", { name: "Activa la organizacion al confirmar el correo." })
  ).toBeVisible();
  await expect(page.getByText(new RegExp(identity.email, "i"))).toBeVisible();
  await assertNoAccessibilityViolations(page);

  await page.goto("/sign-in");
  await page.getByLabel("Correo electronico").fill(identity.email);
  await page.getByLabel("Contrasena").fill(identity.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/my-work$/);
  await expect(page.getByRole("heading", { name: "Mi trabajo" })).toBeVisible();
  await assertNoAccessibilityViolations(page);

  await page.getByRole("link", { name: "Crear flujo" }).click();
  await expect(page).toHaveURL(/\/my-work\/workflows\/new$/);
  await page.getByLabel("Workflow name").fill(`Primer flujo ${identity.runId}`);
  await page.getByRole("button", { name: "Crear flujo" }).click();
  await expect(page.getByRole("heading", { name: /Dise.*Inicio, Tarea y Fin/ })).toBeVisible();

  await page.getByRole("button", { name: "Agregar Start" }).click();
  await page.getByRole("button", { name: "Agregar Task" }).click();
  await page.getByRole("button", { name: "Agregar End" }).click();
  await page.getByRole("button", { name: "Conectar Start con Task" }).click();
  await page.getByRole("button", { name: "Conectar Task con End" }).click();
  await page.getByRole("button", { name: "Validar publicacion" }).click();
  await expect(page.getByText(/define quien puede iniciar este flujo/i)).toBeVisible();
  await expect(page.getByText(/define quien recibe la primera tarea/i)).toBeVisible();

  await page.getByRole("radio", { name: "Todas las personas activas" }).check();
  await page.getByRole("radio", { name: "Quien inicia el flujo" }).check();
  await page.getByLabel("Label").fill("Nombre del caso");
  await page.getByRole("button", { name: "Crear Short text" }).click();
  await page.getByRole("button", { name: "Add to first task" }).click();
  await page.getByRole("button", { name: "Validar publicacion" }).click();
  await expect(
    page.getByText("Ejecuta la validacion para ver los bloqueos de publicacion de este borrador.")
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Publicar version" }).click();
  await expect(page.getByText(/Version 1\./)).toBeVisible();

  await page.goto("/my-work");
  await page.getByRole("button", { name: "Iniciar" }).click();
  await expect(page).toHaveURL(/\/my-work\/tasks\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Tarea" })).toBeVisible();
  await page.getByRole("textbox", { name: "Nombre del caso" }).fill("Caso sintetico autorizado");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("El servidor guardo el avance autorizado.")).toBeVisible();
  await page.getByRole("button", { name: "Completar tarea" }).click();
  await expect(page.getByText("La tarea quedo completa y el proceso llego a su fin.")).toBeVisible();

  const taskUrl = new URL(page.url());
  const taskReference = safeReference(taskUrl.pathname.split("/").at(-1) ?? "");
  await page.goto("/my-work");
  await page.getByRole("link", { name: "Mis procesos" }).click();
  await page.getByRole("link", { name: "Ver proceso" }).first().click();
  await expect(
    page.getByRole("heading", { name: new RegExp(`Primer flujo ${identity.runId}`) })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Linea de tiempo" })).toBeVisible();

  const processUrl = new URL(page.url());
  await attachJourneyEvidence(testInfo, {
    buildId,
    host: processUrl.host,
    organizationRef: identity.organizationReference,
    processRef: safeReference(processUrl.pathname.split("/").at(-1) ?? ""),
    taskRef: taskReference
  });
});
