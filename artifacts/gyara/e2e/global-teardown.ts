import { getSupabaseBase, deleteTestUser } from "./helpers/supabase-admin.ts";

export default async function globalTeardown() {
  const id = process.env.E2E_TEST_ID;
  if (!id) return;
  const base = getSupabaseBase();
  await deleteTestUser(base, id);
  console.log(`[e2e teardown] test user deleted: ${id}`);
}
