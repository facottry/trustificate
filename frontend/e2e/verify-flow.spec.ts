import { test, expect } from "@playwright/test";

test.describe("Certificate Verification Flow", () => {
  test("verify page has search form", async ({ page }) => {
    await page.goto("/verify");
    const searchInput = page.getByPlaceholder(/CC-2026/i);
    await expect(searchInput).toBeVisible();
    await expect(page.getByRole("button", { name: /verify/i })).toBeVisible();
  });

  test("verify page shows how it works section", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/how verification works/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /tamper-proof/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /qr code scanning/i })).toBeVisible();
  });

  test("verify page shows FAQ section", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/verification faq/i)).toBeVisible();
    await expect(page.getByText(/where do i find the certificate number/i)).toBeVisible();
  });

  test("verify page has CTA section", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/want to issue verifiable certificates/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /get started free/i })).toBeVisible();
  });

  test("searching for invalid certificate shows not found", async ({ page }) => {
    await page.goto("/verify");
    const searchInput = page.getByPlaceholder(/CC-2026/i);
    await searchInput.fill("INVALID-CERT-123");
    await page.getByRole("button", { name: /verify/i }).click();
    // Should show not found (API will fail since no backend)
    await expect(page.getByText(/certificate not found/i)).toBeVisible({ timeout: 10000 });
  });

  test("landing page verify section navigates to verify page", async ({ page }) => {
    await page.goto("/");
    const verifyInput = page.getByPlaceholder(/CERT-2026/i);
    await verifyInput.fill("TEST-CERT");
    await verifyInput.press("Enter");
    await expect(page).toHaveURL(/\/verify/);
  });
});
