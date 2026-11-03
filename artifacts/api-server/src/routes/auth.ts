import { Router } from "express";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { logger } from "../lib/logger.js";

const router = Router();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SECRET = process.env.SESSION_SECRET ?? "dev-secret";
const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL ?? "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const APP_URL = process.env.APP_URL ?? "https://maigyara.com";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function makeToken(userId: string): string {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${expiry}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function parseToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dotCount = (decoded.match(/\./g) ?? []).length;
    if (dotCount < 2) return null;
    const lastDot = decoded.lastIndexOf(".");
    const secondLastDot = decoded.lastIndexOf(".", lastDot - 1);
    const userId = decoded.slice(0, secondLastDot);
    const expiry = decoded.slice(secondLastDot + 1, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const payload = `${userId}.${expiry}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    if (Date.now() > parseInt(expiry, 10)) return null;
    return { userId };
  } catch {
    return null;
  }
}

router.post("/auth/send-verification", async (req, res) => {
  const { userId, email, name } = req.body as {
    userId?: string;
    email?: string;
    name?: string;
  };

  if (!userId || !email) {
    res.status(400).json({ error: "userId and email are required" });
    return;
  }

  if (!resend) {
    logger.error("RESEND_API_KEY is not configured; cannot send verification email");
    res.status(500).json({ error: "Email service is not configured" });
    return;
  }

  const token = makeToken(userId);
  const verifyUrl = `${APP_URL}/verify?token=${token}`;
  const safeName = name ? escapeHtml(name.trim()) : "";

  const { error } = await resend.emails.send({
    from: "Maigyara <hello@maigyara.com>",
    to: email,
    subject: "Verify your Maigyara email address",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#ffffff">
        <div style="margin-bottom:28px">
          <span style="font-size:22px;font-weight:800;color:#1D6FEB">Gyara</span>
          <span style="font-size:13px;color:#888;margin-left:8px">by Danmari Tech Group</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 10px">
          ${safeName ? `Welcome, ${safeName}!` : "Welcome to Maigyara!"}
        </h1>
        <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 28px">
          Thanks for joining Gyara — Nigeria's trusted artisan directory.
          Click the button below to verify your email and activate your account.
        </p>
        <a href="${verifyUrl}"
          style="display:inline-block;background:#1D6FEB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.01em">
          Verify my email
        </a>
        <p style="font-size:13px;color:#999;margin-top:32px;line-height:1.5">
          This link expires in 24 hours.<br>
          If you didn't sign up for Maigyara, you can safely ignore this email.
        </p>
        <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#bbb">
          © 2026 Danmari Tech Group · <a href="https://maigyara.com" style="color:#bbb">maigyara.com</a>
        </div>
      </div>
    `,
  });

  if (error) {
    logger.error({ err: error }, "Resend: failed to send verification email");
    res.status(500).json({ error: "Failed to send verification email" });
    return;
  }

  res.json({ ok: true });
});

router.get("/auth/verify", async (req, res) => {
  const token = req.query["token"] as string | undefined;
  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const parsed = parseToken(token);
  if (!parsed) {
    res.status(400).json({ error: "Invalid or expired verification link" });
    return;
  }

  const rpcRes = await fetch(`${rawSupabaseUrl}/rest/v1/rpc/mark_email_verified`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_user_id: parsed.userId }),
  });

  if (!rpcRes.ok) {
    const body = await rpcRes.text();
    logger.error({ status: rpcRes.status, body }, "Supabase: failed to mark email verified");
    res.status(500).json({ error: "Could not update account — please try again" });
    return;
  }

  res.json({ ok: true });
});

export default router;
