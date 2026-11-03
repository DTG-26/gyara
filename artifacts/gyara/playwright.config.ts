import { defineConfig, devices } from "@playwright/test";
import { execSync } from "child_process";

function systemChromium(): string | undefined {
  try {
    const p = execSync("which chromium", { encoding: "utf-8" }).trim();
    return p || undefined;
  } catch {
    return undefined;
  }
}

const chromiumPath = systemChromium();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:80",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          ...(chromiumPath ? { executablePath: chromiumPath } : {}),
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
  ],
});
