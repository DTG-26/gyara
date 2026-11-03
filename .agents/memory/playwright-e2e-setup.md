---
name: Playwright e2e setup
description: How Playwright is wired up in the Gyara workspace, including NixOS browser quirks and test-user lifecycle.
---

## Rule
Playwright lives in `artifacts/gyara/`. Run with `pnpm --filter @workspace/gyara run test:e2e`.

## NixOS browser quirk
Playwright's downloaded `chrome-headless-shell` binary fails with missing shared libs (`libgbm.so.1`, etc.) on the Replit NixOS sandbox. Fix: install `chromium` as a system Nix package and set `launchOptions.executablePath` to `which chromium` in `playwright.config.ts`. The config auto-detects the system binary via `execSync("which chromium")`.

**Why:** NixOS doesn't expose glibc-linked system libs to foreign binaries. The Nix-packaged `chromium` binary has all deps in its closure.

**How to apply:** If the Playwright binary ever fails again with "cannot open shared object file", re-run `installSystemDependencies({ packages: ["chromium"] })` and verify `which chromium` resolves in Node.

## Test user lifecycle
- `e2e/global-setup.ts` creates a fresh Supabase user via admin API before the suite.
- `e2e/global-teardown.ts` deletes it after.
- Credentials are passed through `process.env.E2E_TEST_EMAIL` / `E2E_TEST_PASS` / `E2E_TEST_ID`.
- `VITE_SUPABASE_URL` ends with `/rest/v1/` — strip that suffix to get the auth admin base URL.

## AuthModal selector notes
- The modal is a plain `<div>`, no `role="dialog"`. Check for `getByRole("heading", { name: "Customer Account" })` to confirm the modal is open.
- Email/password fields use `placeholder` text, not aria-labels.
- Submit button has `data-testid="button-auth-submit"` (added in Task #40).
- Nav button is `data-testid="nav-signin"`, sign-out is `data-testid="nav-signout"`.
- There are multiple `type="submit"` and "Sign In" text elements on the page simultaneously — always scope to `data-testid="button-auth-submit"`.
