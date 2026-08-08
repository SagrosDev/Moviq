import type { Page } from "@playwright/test";

export const mockCsrfBootstrap = async (page: Page, token = "test-token") => {
  await page.route("**/api/v1/auth/csrf/", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Set-Cookie": `csrftoken=${token}; Path=/` },
      body: JSON.stringify({ csrfToken: token })
    });
  });
};
