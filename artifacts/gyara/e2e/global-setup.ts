import { getSupabaseBase, createTestUser } from "./helpers/supabase-admin.ts";

export default async function globalSetup() {
  const base = getSupabaseBase();
  const user = await createTestUser(base);
  process.env.E2E_TEST_EMAIL = user.email;
  process.env.E2E_TEST_ID = user.id;
  process.env.E2E_TEST_PASS = "TestPass123!";
  console.log(`[e2e setup] test user created: ${user.email}`);
}
