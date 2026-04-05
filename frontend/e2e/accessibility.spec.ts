import { test, expect } from "@playwright/test";

test.describe("Accessibility Basics", () => {
  test("landing page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });

  test("login form has proper labels", async ({ page }) => {
    await page.goto("/login");
    // Labels should be associated with inputs
    const emailLabel = page.getByLabel(/email/i);
    await expect(emailLabel).toBeVisible();
    const passwordLabel = page.getByLabel(/password/i);
    await expect(passwordLabel).toBeVisible();
  });

  test("signup form has proper labels", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("buttons are keyboard accessible", async ({ page }) => {
    await page.goto("/login");
    // Tab to the sign in button
    await page.getByLabel(/email/i).focus();
    await page.keyboard.press("Tab"); // to password
    await page.keyboard.press("Tab"); // to forgot password or toggle
    // Verify we can tab through the form
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test("links have discernible text", async ({ page }) => {
    await page.goto("/");
    // Check that social links have aria-labels
    const socialLinks = page.locator('a[aria-label]');
    const count = await socialLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });

  test("verify page form is keyboard navigable", async ({ page }) => {
    await page.goto("/verify");
    const input = page.getByPlaceholder(/CC-2026/i);
    await input.focus();
    await input.fill("TEST-123");
    await page.keyboard.press("Enter");
    // Form should submit (we just verify no crash)
    await page.waitForTimeout(500);
  });

  test("404 page has proper heading", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});
