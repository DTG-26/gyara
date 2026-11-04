import { createClient } from "@supabase/supabase-js";

// Public Supabase project settings. The publishable key is safe to ship to the browser
// (access is enforced by Row Level Security). Env vars override these if set.
const DEFAULT_SUPABASE_URL = "https://kjfgxuppryienxinyszv.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aVnervrwgzp_MYGNXTQvjQ_kOy2IW3a";

// Strip any accidentally-included /rest/v1 suffix from the project URL
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);

export const VERIFY_EMAIL_SENTINEL = "verify_email";
