const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function getSupabaseBase(): string {
  const raw = process.env.VITE_SUPABASE_URL ?? "";
  return raw.replace(/\/rest\/v1\/?$/, "");
}

export async function createTestUser(
  base: string
): Promise<{ id: string; email: string }> {
  const email = `gyara.e2e.${Date.now()}@mailtest.dev`;
  const resp = await fetch(`${base}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: "TestPass123!",
      email_confirm: true,
      user_metadata: { name: "Test Runner" },
    }),
  });
  const body = (await resp.json()) as { id?: string; message?: string };
  if (!body.id) {
    throw new Error(`Failed to create test user: ${body.message ?? "unknown"}`);
  }

  const restBase = process.env.VITE_SUPABASE_URL ?? "";
  await fetch(`${restBase}profiles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: body.id, name: "Test Runner" }),
  });

  return { id: body.id, email };
}

export async function deleteTestUser(base: string, id: string): Promise<void> {
  await fetch(`${base}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
  });
}
