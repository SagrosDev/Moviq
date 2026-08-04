import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

test("public landing exposes semantic sections and keyboard focus", async ({ browserName, page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /convierte procesos repetibles/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /un camino sencillo/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /tres casos ficticios/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegación de la página" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText(/WhatsApp|MFA|SSO|garantizado/i)).toHaveCount(0);

  if (browserName === "webkit") {
    await page.getByRole("link", { name: "Moviqo" }).first().focus();
  } else {
    await page.keyboard.press("Tab");
  }
  await expect(page.getByRole("link", { name: "Moviqo" }).first()).toBeFocused();
});

test("language selector is keyboard operable and persists locally", async ({ browserName, page }) => {
  await page.goto("/");

  if (browserName === "webkit") {
    await page.getByLabel("Idioma").focus();
  } else {
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
  }
  await expect(page.getByLabel("Idioma")).toBeFocused();

  await page.getByLabel("Idioma").selectOption("en");
  await expect(page.getByRole("heading", { name: /turn repeatable processes/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /three fictional cases/i })).toBeVisible();

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByLabel("Language")).toHaveValue("en");
  await expect(page.getByRole("navigation", { name: "Page navigation" })).toBeVisible();
});

test("public landing passes scoped axe checks and exposes safe CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Iniciar beta gratuita" }).first()).toHaveAttribute("href", "/register");
  await expect(page.getByRole("link", { name: "Ingresar" }).first()).toHaveAttribute("href", "/sign-in");
  await page.addScriptTag({ path: axePath });

  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import("axe-core") }).axe;
    return axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
  });

  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
});

test("design-system catalog exposes named components, states, and safe metadata", async ({ page }) => {
  await page.goto("/design-system");

  await expect(page.getByRole("heading", { name: "Sistema de diseno" })).toBeVisible();
  await expect(page.getByLabel("Idioma")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardando" })).toBeDisabled();
  await expect(page.getByLabel("Revision inicial")).toContainText("Listo");
  await expect(page.getByRole("button", { name: "Cambiar asignacion" })).toBeVisible();
  await expect(page.getByText("Necesita atencion")).toBeVisible();
  await expect(page.getByText(/Evidencia del catalogo/)).toBeVisible();

  await page.getByRole("button", { name: "Guardar borrador" }).focus();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeFocused();
});

test("design-system page passes scoped axe checks", async ({ page }) => {
  await page.goto("/design-system");
  await page.addScriptTag({ path: axePath });

  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import("axe-core") }).axe;
    return axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
      }
    });
  });

  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target)
    }))
  ).toEqual([]);
});

test("registration server errors stay localized and associated with consent controls", async ({ page }) => {
  await page.route("**/api/v1/organizations/registrations/", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/problem+json",
      headers: { "X-Correlation-ID": "safe-correlation-123" },
      body: JSON.stringify({
        type: "https://api.moviqo.local/problems/validation-failed",
        title: "Validation failed",
        status: 400,
        code: "validation_failed",
        correlationId: "safe-correlation-123",
        invalidParams: [
          { name: "termsAccepted", reason: "unsafe server text", code: "required" },
          { name: "privacyAccepted", reason: "unsafe server text", code: "unknown_code" }
        ]
      })
    });
  });

  await page.goto("/register");
  await page.getByRole("button", { name: "Enviar registro" }).click();

  await expect(page.getByRole("alert").last()).toContainText("Corrige los datos marcados");
  await expect(page.locator("#registration-terms")).toHaveAttribute(
    "aria-describedby",
    "registration-terms-error"
  );
  await expect(page.locator("#registration-privacy")).toHaveAttribute(
    "aria-describedby",
    "registration-privacy-error"
  );
  await expect(page.locator("#registration-terms-error")).toHaveText(
    "Completa este campo para continuar."
  );
  await expect(page.locator("#registration-privacy-error")).toHaveText(
    "Revisa este campo e intenta de nuevo."
  );
});

test("operational and catalog surfaces remain usable at narrow width and 200 percent text", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/design-system");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });

  await expect(page.getByRole("heading", { name: "Sistema de diseno" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeVisible();
  await expect(page.getByText(/autoria completa requiere 1280/)).toBeVisible();
});
