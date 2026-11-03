import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { VERIFY_EMAIL_SENTINEL } from "@/lib/supabase";

export function AuthModal({ onClose, initialMode = "signin" }: { onClose: () => void; initialMode?: "signin" | "signup" }) {
  const { login, signup } = useCustomer();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);

  const inputClass =
    "w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const err =
        mode === "signin"
          ? await login(form.email, form.password)
          : await signup(form.name, form.email, form.password);
      if (err === VERIFY_EMAIL_SENTINEL) {
        setVerifyEmail(true);
      } else if (err) {
        setError(err);
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-background rounded-2xl shadow-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Customer Account</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {verifyEmail ? (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base mb-1">Check your inbox</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We sent a verification link to <span className="font-semibold text-foreground">{form.email}</span>.
                Click it to activate your account, then come back to sign in.
              </p>
            </div>
            <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground text-left leading-relaxed">
              <span className="font-semibold text-foreground">Didn't receive it?</span> Check your spam folder. The link expires in 24 hours.
            </div>
            <button
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            <div className="flex border border-border rounded-xl overflow-hidden mb-5 w-fit">
              <button
                onClick={() => { setMode("signin"); setError(""); }}
                className={`px-4 py-2 text-sm font-semibold transition-all ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                className={`px-4 py-2 text-sm font-semibold transition-all ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuth} noValidate className="space-y-3">
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
              />
              <input
                type="password"
                placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputClass}
              />
              {error && <p className="text-xs text-destructive font-medium">⚠ {error}</p>}
              <button
                type="submit"
                data-testid="button-auth-submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="text-xs text-muted-foreground mt-4 text-center leading-relaxed">
              A customer account lets you leave verified reviews for artisans you've hired.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
