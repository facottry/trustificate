import { test, expect } from "@playwright/test";

test.describe("Site Navigation", () => {
  test("logo links to home page", async ({ page }) => {
    await page.goto("/login");
    // Click the logo link (first one)
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL("/");
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/pricing/i).first()).toBeVisible();
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText(/about/i).first()).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
  });

  test("careers page loads", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByText(/contact/i).first()).toBeVisible();
  });

  test("blog page loads", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("verify page loads with search input", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/verify a certificate/i)).toBeVisible();
    await expect(page.getByPlaceholder(/CC-2026/i)).toBeVisible();
  });

  test("docs page loads", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("testimonials page loads", async ({ page }) => {
    await page.goto("/testimonials");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("newsletter archive page loads", async ({ page }) => {
    await page.goto("/newsletter");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Protected Route Redirects", () => {
  test("dashboard redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login since there's no auth token
    await expect(page).toHaveURL(/\/(login|verify-email)/);
  });

  test("templates redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/templates");
    await expect(page).toHaveURL(/\/(login|verify-email)/);
  });

  test("settings redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/(login|verify-email)/);
  });
});
