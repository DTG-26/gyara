import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase, isSupabaseConfigured, VERIFY_EMAIL_SENTINEL } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface CustomerContextValue {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateCustomer: (fields: { name?: string; currentPassword?: string; newPassword?: string }) => Promise<string | null>;
  deleteCustomer: () => Promise<string | null>;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

async function fetchProfile(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();
  return data?.name ?? "";
}

function sessionToCustomer(session: Session, name: string): Customer {
  return {
    id: session.user.id,
    name: name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
    email: session.user.email ?? "",
    createdAt: session.user.created_at,
  };
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  // Safety flag: set true before signUp() so that even if Supabase fires
  // a SIGNED_IN event before returning {session: null}, it is blocked.
  const blockSignInRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Safety valve: if INITIAL_SESSION never fires (network blip, Supabase
    // slow to respond), clear the spinner after 5 s rather than hanging forever.
    const safetyTimer = setTimeout(() => setLoading(false), 5000);

    // Rely entirely on onAuthStateChange instead of getSession() to avoid a
    // race condition where an expired token causes getSession() to return null,
    // which sets loading=false before TOKEN_REFRESHED fires with the real session.
    // onAuthStateChange fires INITIAL_SESSION synchronously as its first event
    // (with the current or freshly-refreshed session), eliminating the race.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") {
          clearTimeout(safetyTimer);
          try {
            if (session && !blockSignInRef.current) {
              const name = await fetchProfile(session.user.id);
              if (!blockSignInRef.current) {
                setCustomer(sessionToCustomer(session, name));
              }
            }
          } finally {
            setLoading(false);
          }
        } else if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          if (blockSignInRef.current) return;
          const name = await fetchProfile(session.user.id);
          if (blockSignInRef.current) return;
          setCustomer(sessionToCustomer(session, name));
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          blockSignInRef.current = false;
          setCustomer(null);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (
        error.message.includes("Email not confirmed") ||
        error.message.includes("email_not_confirmed")
      ) {
        return VERIFY_EMAIL_SENTINEL;
      }
      return "Incorrect email or password.";
    }
    return null;
  }

  async function signup(name: string, email: string, password: string): Promise<string | null> {
    if (!name.trim()) return "Full name is required.";
    if (!email.trim() || !email.includes("@")) return "A valid email address is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";

    // Block any SIGNED_IN event fired during/after signUp before we can inspect the result.
    blockSignInRef.current = true;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });

    if (error) {
      blockSignInRef.current = false;
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        return "An account with this email already exists. Please sign in.";
      }
      return error.message;
    }

    // When Supabase "Confirm email" is OFF, signUp returns a session and the
    // user is signed in straight away. When it is ON, no session is returned.
    if (data.user) {
      // Upsert profile regardless of whether session is present
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, name: name.trim() }, { onConflict: "id" });

      if (data.session) {
        // No email confirmation required — sign the user in immediately.
        blockSignInRef.current = false;
        setCustomer(sessionToCustomer(data.session, name.trim()));
        return null;
      }

      // Fallback: Supabase still requires confirmation — user must verify before signing in.
      blockSignInRef.current = false;
      return VERIFY_EMAIL_SENTINEL;
    }

    blockSignInRef.current = false;
    return null;
  }

  async function logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // If the network call fails, clear local state anyway so the user
      // isn't stuck in a logged-in UI with a broken session.
      setCustomer(null);
    }
  }

  async function updateCustomer(
    fields: { name?: string; currentPassword?: string; newPassword?: string }
  ): Promise<string | null> {
    if (!customer) return "Not signed in.";

    if (fields.newPassword !== undefined) {
      if (!fields.currentPassword) return "Current password is required.";
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: customer.email,
        password: fields.currentPassword,
      });
      if (reAuthError) return "Current password is incorrect.";
      if (fields.newPassword.length < 6) return "New password must be at least 6 characters.";
      const { error } = await supabase.auth.updateUser({ password: fields.newPassword });
      if (error) return error.message;
    }

    if (fields.name !== undefined) {
      const trimmed = fields.name.trim();
      if (!trimmed) return "Name cannot be empty.";
      const { error } = await supabase
        .from("profiles")
        .update({ name: trimmed })
        .eq("id", customer.id);
      if (error) return error.message;
      setCustomer((prev) => (prev ? { ...prev, name: trimmed } : null));
    }

    return null;
  }

  async function deleteCustomer(): Promise<string | null> {
    if (!customer) return "Not signed in.";
    const { error } = await supabase.rpc("delete_user");
    if (error) {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", customer.id);
      if (profileError) return profileError.message;
    }
    await supabase.auth.signOut();
    return null;
  }

  return (
    <CustomerContext.Provider
      value={{ customer, loading, login, signup, logout, updateCustomer, deleteCustomer }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
