import { test, expect } from "@playwright/test";

test.describe("Public Pages Navigation", () => {
  test("landing page loads with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("trust layer");
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
  });

  test("landing page has navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /pricing/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /blog/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /about/i }).first()).toBeVisible();
  });

  test("landing page has verify credential section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /verify a credential/i })).toBeVisible();
    await expect(page.getByPlaceholder(/CERT-2026/i)).toBeVisible();
  });

  test("landing page has features section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/template-driven issuance/i)).toBeVisible();
    await expect(page.getByText(/instant public verification/i)).toBeVisible();
  });

  test("landing page has footer with links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByText(/TRUSTIFICATE, Inc/i)).toBeVisible();
    await expect(footer.getByRole("link", { name: "Terms", exact: true })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Privacy", exact: true })).toBeVisible();
  });

  test("404 page shows for unknown routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText(/page not found/i)).toBeVisible();
  });

  test("404 page has home link", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
  });
});
