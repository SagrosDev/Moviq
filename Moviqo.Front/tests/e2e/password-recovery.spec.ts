import { expect, test } from "@playwright/test";

test("password recovery request and token reset remain generic and sessionless", async ({ page }) => {
  await page.route("**/api/v1/auth/csrf/", async (route) => {
    await route.fulfill({ status: 200, headers: { "Set-Cookie": "csrftoken=test-token; Path=/" }, body: JSON.stringify({ csrfToken: "test-token" }) });
  });
  await page.route("**/api/v1/auth/password-recovery/", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ status: "recovery_requested" }) });
  });
  await page.route("**/api/v1/auth/password-reset/", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ status: "password_reset" }) });
  });

  await page.goto("/password-recovery");
  await page.getByLabel("Correo electronico").fill("unknown@example.com");
  await page.getByRole("button", { name: "Enviar instrucciones" }).click();
  await expect(page.getByRole("status")).toContainText("Si existe una cuenta elegible");

  await page.goto("/password-reset?token=synthetic-token");
  await page.getByRole("textbox", { name: "Contrasena nueva" }).fill("new-password-that-is-long-enough");
  await page.getByRole("button", { name: "Cambiar contrasena" }).click();
  await expect(page.getByRole("link", { name: "Ir a ingresar" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
