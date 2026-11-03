import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "success" | "error";

export default function VerifyPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Check the link in your email.");
      return;
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json() as { ok?: boolean; error?: string };
        if (res.ok && data.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not reach the server. Please try again.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-5">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="text-primary animate-spin" />
            <div>
              <h2 className="text-xl font-extrabold text-foreground mb-1">Verifying your email…</h2>
              <p className="text-muted-foreground text-sm">Just a moment.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Email verified!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your Maigyara account is now fully activated. You can start using all features.
              </p>
            </div>
            <button
              onClick={() => setLocation("/artisans")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
            >
              Go to Artisan Directory
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Verification failed</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
