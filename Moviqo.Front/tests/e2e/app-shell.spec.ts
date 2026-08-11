import { expect, test, type Response } from "@playwright/test";
import { createRequire } from "node:module";
import { expectApiOk } from "./support/deployedJourney";
import { mockCsrfBootstrap } from "./support/mockCsrf";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

test("sign-in restores the validated protected pathname, search, and hash", async ({ page }) => {
  let signedIn = false;
  await mockCsrfBootstrap(page);
  await page.route("**/api/v1/auth/session/", async (route) => {
    await route.fulfill({
      status: signedIn ? 200 : 401,
      contentType: signedIn ? "application/json" : "application/problem+json",
      body: JSON.stringify(signedIn ? {
        authenticated: true,
        user: { id: 1, displayName: "Ana", preferredLanguage: "es" },
        membership: {
          id: "018f6d8c-6a58-7000-8000-000000000001",
          organizationId: "018f6d8c-6a58-7000-8000-000000000002",
          organizationTimezone: "America/Bogota",
          role: "owner"
        }
      } : {
        type: "https://api.moviqo.local/problems/not-authenticated",
        title: "Not authenticated",
        status: 401,
        code: "not_authenticated",
        correlationId: "protected-redirect-123"
      })
    });
  });
  await page.route("**/api/v1/auth/sign-in/", async (route) => {
    signedIn = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/api/v1/my-work/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        startWorkflows: { items: [], limit: 6, hasMore: false },
        myTasks: { items: [], limit: 12, hasMore: false },
        myProcesses: { items: [], limit: 12, hasMore: false }
      })
    });
  });

  await page.goto("/my-work/tasks?view=open#first");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Correo electrónico").fill("ana@example.com");
  await page.getByRole("textbox", { name: "Contraseña" }).fill("a-secure-password-123");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/my-work\/tasks\?view=open#first$/);
  await expect(page.getByRole("heading", { level: 1, name: "Mis tareas" })).toBeVisible();
});

test("deployed API success checks do not read discarded navigation response bodies", async () => {
  let responseBodyRead = false;
  const navigatedResponse = {
    ok: () => true,
    text: async () => {
      responseBodyRead = true;
      throw new Error("Response body is unavailable after navigation.");
    }
  } as unknown as Response;

  await expectApiOk(navigatedResponse);

  expect(responseBodyRead).toBe(false);
});

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
  const languageTrigger = page.locator('[data-language-trigger="true"]');

  if (browserName === "webkit") {
    await languageTrigger.focus();
  } else {
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
  }
  await expect(languageTrigger).toBeFocused();

  await languageTrigger.press("Enter");
  await page.getByRole("listbox", { name: "Idioma" }).press("ArrowDown");
  await page.getByRole("listbox", { name: "Idioma" }).press("Enter");
  await expect(page.getByRole("heading", { name: /turn repeatable processes/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /three fictional cases/i })).toBeVisible();

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("button", { name: "Language: English" })).toBeVisible();
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

test("landing metadata follows the selected locale without private URLs", async ({ page }) => {
  await page.goto("/en/");

  await expect(page).toHaveTitle("Moviqo · Clear processes");
  await expect(page.locator('html')).toHaveAttribute("lang", "en");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Moviqo helps teams/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/$/);
  await expect(page.locator('link[rel="alternate"]')).toHaveAttribute("hreflang", "es");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /\/en\/$/);
  await expect(page.locator('meta[property="og:url"]')).not.toHaveAttribute("content", /[?&#]/);
  await expect(page.locator("script[src*='analytics'], script[src*='track'], script[src*='marketing']")).toHaveCount(0);
});

test("landing remains usable at mobile width and 200 percent text", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });

  await expect(page.getByRole("heading", { name: /convierte procesos repetibles/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Iniciar beta gratuita" }).first()).toBeVisible();
  const horizontalOverflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.right > document.documentElement.clientWidth + 1 || bounds.left < -1;
      })
      .slice(0, 10)
      .map((element) => ({
        className: element.className,
        tagName: element.tagName,
        text: element.textContent?.trim().slice(0, 80)
      }))
  }));
  expect(
    horizontalOverflow.scrollWidth - horizontalOverflow.clientWidth,
    JSON.stringify(horizontalOverflow, null, 2)
  ).toBeLessThanOrEqual(1);
  expect(horizontalOverflow.offenders).toEqual([]);
});

test("landing conversion preserves the selected language and keeps public routes data-free", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/v1/")) apiRequests.push(request.url());
  });
  await page.goto("/");
  await page.locator('[data-language-trigger="true"]').click();
  await page.getByRole("option", { name: "Inglés" }).click();
  await page.getByRole("link", { name: "Start Free Beta" }).first().click();
  await expect(page).toHaveURL(/\/register(\?lang=en)?$/);
  await expect(page.getByText(/Workflow|Process Data|Organization detail|dashboard/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /start process|start workflow|iniciar proceso|iniciar flujo/i })).toHaveCount(0);

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Sign in to Moviqo" })).toBeVisible();
  await expect(page.getByText(/Workflow|Process Data|Organization detail|dashboard/i)).toHaveCount(0);
  await page.goto("/register?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Register the organization and its first owner." })).toBeVisible();
  await expect(page.getByRole("link", { name: /start process|start workflow|iniciar proceso|iniciar flujo/i })).toHaveCount(0);
  expect(apiRequests.filter((url) => !url.includes("/api/v1/auth/session/") && !url.includes("/api/v1/auth/csrf/"))).toEqual([]);
});

test("design-system catalog exposes named components, states, and safe metadata", async ({ page }) => {
  await page.goto("/design-system");

  await expect(page.getByRole("heading", { name: /Sistema de dise/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Idioma: Español/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Registrar organizaci/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Entorno interno con datos sint/ })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardando" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Ingresa a Moviqo" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mostrar contrase/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Mostrar contrase/ })).toHaveText("");
  await page.getByRole("button", { name: /Mostrar contrase/ }).click();
  await expect(page.getByRole("button", { name: /Ocultar contrase/ })).toBeVisible();
  await expect(page.locator("#catalog-sign-in-password")).toHaveAttribute("type", "text");
  await expect(page.getByRole("heading", { name: /Registra la organizaci/ })).toBeVisible();
  await expect(page.getByLabel(/Nombre de la organizaci/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText(/Necesita atenci/, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Evidencia del cat/)).toBeVisible();

  const saveDraftButton = page.getByRole("button", { name: "Guardar borrador" });
  await saveDraftButton.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(saveDraftButton).toBeFocused();
  await expect(saveDraftButton).toHaveCSS(
    "outline-color",
    "rgb(37, 99, 235)"
  );

  await page.getByRole("button", { name: "Volver" }).hover();
  await expect(page.getByRole("button", { name: "Volver" })).toHaveCSS(
    "border-color",
    "rgb(15, 118, 110)"
  );
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
  await mockCsrfBootstrap(page);
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
  await page.locator("#registration-owner-name").fill("Ana Prueba");
  await page.locator("#registration-organization-name").fill("Organización sintética");
  await page.locator("#registration-email").fill("ana@example.test");
  await page.locator("#registration-password").fill("Synthetic-Password-2040!");
  await page.locator("#registration-terms").check();
  await page.locator("#registration-privacy").check();
  await page.locator("#registration-prohibited-data").check();
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

  await expect(page.getByRole("heading", { name: /Sistema de dise/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeVisible();
  await expect(page.getByText(/autoria completa requiere 1280/)).toBeVisible();
});
