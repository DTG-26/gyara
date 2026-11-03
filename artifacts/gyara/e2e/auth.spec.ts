import { test, expect } from "@playwright/test";

const EMAIL = () => process.env.E2E_TEST_EMAIL!;
const PASS = () => process.env.E2E_TEST_PASS!;

async function signIn(page: import("@playwright/test").Page) {
  await page.getByTestId("nav-signin").click();
  await page.getByPlaceholder("Email address").fill(EMAIL());
  await page.getByPlaceholder("Password").fill(PASS());
  await page.getByTestId("button-auth-submit").click();
  await expect(page.getByTestId("nav-signout")).toBeVisible({ timeout: 8000 });
}

test.describe("Auth flow", () => {
  test("sign-in via modal shows authenticated state immediately — no refresh required", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("nav-signin")).toBeVisible({ timeout: 10000 });

    await page.getByTestId("nav-signin").click();

    await expect(
      page.getByRole("heading", { name: "Customer Account" })
    ).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder("Email address").fill(EMAIL());
    await page.getByPlaceholder("Password").fill(PASS());
    await page.getByTestId("button-auth-submit").click();

    await expect(page.getByTestId("nav-signout")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Test Runner")).toBeVisible();
    await expect(page.getByTestId("nav-signin")).not.toBeVisible();
  });

  test("sign-out clears session and restores logged-out nav state", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("nav-signin")).toBeVisible({ timeout: 10000 });
    await signIn(page);

    await page.getByTestId("nav-signout").click();

    await expect(page.getByTestId("nav-signin")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Test Runner")).not.toBeVisible();
    await expect(page.getByTestId("nav-signout")).not.toBeVisible();
  });

  test("session persists across page navigation without re-authentication", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("nav-signin")).toBeVisible({ timeout: 10000 });
    await signIn(page);

    await page.goto("/artisans");
    await expect(
      page.getByTestId("button-customer-settings")
    ).toBeVisible({ timeout: 8000 });

    await page.goto("/");
    await expect(page.getByTestId("nav-signout")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Test Runner")).toBeVisible();
  });
});
