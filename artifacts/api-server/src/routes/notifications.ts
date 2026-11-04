import { Router } from "express";
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

const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || "https://kjfgxuppryienxinyszv.supabase.co")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const APP_URL = process.env.APP_URL ?? "https://maigyara.com";

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: SERVICE_ROLE_KEY,
    // New-style sb_secret_ keys are not JWTs and must not be sent as a Bearer token.
    ...(SERVICE_ROLE_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${SERVICE_ROLE_KEY}` } : {}),
  };
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`${rawSupabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: adminHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch (err) {
    logger.error({ err }, "Supabase admin: failed to fetch user email");
    return null;
  }
}

async function restSelect<T>(table: string, query: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${rawSupabaseUrl}/rest/v1/${table}?${query}`, {
      headers: adminHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch (err) {
    logger.error({ err, table }, "Supabase REST: select failed");
    return null;
  }
}

function emailShell(title: string, bodyHtml: string, ctaText: string, ctaUrl: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#ffffff">
      <div style="margin-bottom:28px">
        <span style="font-size:22px;font-weight:800;color:#1D6FEB">Gyara</span>
        <span style="font-size:13px;color:#888;margin-left:8px">by Danmari Tech Group</span>
      </div>
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 10px">${title}</h1>
      ${bodyHtml}
      <a href="${ctaUrl}"
        style="display:inline-block;background:#1D6FEB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.01em;margin-top:20px">
        ${ctaText}
      </a>
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#bbb">
        © 2026 Danmari Tech Group · <a href="https://maigyara.com" style="color:#bbb">maigyara.com</a>
      </div>
    </div>
  `;
}

router.post("/notifications/review-created", async (req, res) => {
  const { artisanId, reviewId } = req.body as { artisanId?: number; reviewId?: number };
  if (!artisanId || !reviewId) {
    res.status(400).json({ error: "artisanId and reviewId are required" });
    return;
  }

  if (!SERVICE_ROLE_KEY || !resend) {
    logger.error("SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY is not configured; skipping review notification");
    res.json({ ok: false });
    return;
  }

  const [artisans, reviews] = await Promise.all([
    restSelect<{ id: number; name: string; owner_customer_id: string | null }>(
      "artisans",
      `id=eq.${artisanId}&select=id,name,owner_customer_id`,
    ),
    restSelect<{ id: number; reviewer_name: string; rating: number; comment: string }>(
      "reviews",
      `id=eq.${reviewId}&select=id,reviewer_name,rating,comment`,
    ),
  ]);

  const artisan = artisans?.[0];
  const review = reviews?.[0];

  if (!artisan?.owner_customer_id || !review) {
    res.json({ ok: false });
    return;
  }

  const email = await getUserEmail(artisan.owner_customer_id);
  if (!email) {
    res.json({ ok: false });
    return;
  }

  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const safeArtisanFirstName = escapeHtml(artisan.name.split(" ")[0]);
  const safeReviewerName = escapeHtml(review.reviewer_name);
  const safeComment = escapeHtml(review.comment);
  const { error } = await resend.emails.send({
    from: "Maigyara <hello@maigyara.com>",
    to: email,
    subject: `New review from ${review.reviewer_name}`,
    html: emailShell(
      `You've got a new review, ${safeArtisanFirstName}!`,
      `
        <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 10px">
          <strong>${safeReviewerName}</strong> left you a review:
        </p>
        <p style="font-size:16px;color:#f5a623;margin:0 0 10px;letter-spacing:2px">${stars}</p>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 10px;font-style:italic">"${safeComment}"</p>
      `,
      "View your profile",
      `${APP_URL}/artisans/${artisan.id}`,
    ),
  });

  if (error) {
    logger.error({ err: error }, "Resend: failed to send review notification email");
    res.json({ ok: false });
    return;
  }

  res.json({ ok: true });
});

router.post("/notifications/new-message", async (req, res) => {
  const { artisanId, customerId, senderId } = req.body as {
    artisanId?: number;
    customerId?: string;
    senderId?: string;
  };
  if (!artisanId || !customerId || !senderId) {
    res.status(400).json({ error: "artisanId, customerId and senderId are required" });
    return;
  }

  if (!SERVICE_ROLE_KEY || !resend) {
    logger.error("SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY is not configured; skipping message notification");
    res.json({ ok: false });
    return;
  }

  const artisans = await restSelect<{ id: number; name: string; owner_customer_id: string | null }>(
    "artisans",
    `id=eq.${artisanId}&select=id,name,owner_customer_id`,
  );
  const artisan = artisans?.[0];
  if (!artisan) {
    res.json({ ok: false });
    return;
  }

  const isArtisanSender = senderId === artisan.owner_customer_id;
  const recipientId = isArtisanSender ? customerId : artisan.owner_customer_id;
  if (!recipientId) {
    res.json({ ok: false });
    return;
  }

  const [email, senderProfiles] = await Promise.all([
    getUserEmail(recipientId),
    restSelect<{ id: string; name: string }>("profiles", `id=eq.${senderId}&select=id,name`),
  ]);
  if (!email) {
    res.json({ ok: false });
    return;
  }

  const senderName = senderProfiles?.[0]?.name || (isArtisanSender ? artisan.name : "Someone");
  const safeSenderName = escapeHtml(senderName);
  const safeArtisanName = escapeHtml(artisan.name);

  const { error } = await resend.emails.send({
    from: "Maigyara <hello@maigyara.com>",
    to: email,
    subject: `New message from ${senderName}`,
    html: emailShell(
      "You have a new message",
      `
        <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 10px">
          <strong>${safeSenderName}</strong> sent you a message about ${isArtisanSender ? "your inquiry with" : "a booking with"} <strong>${safeArtisanName}</strong> on Gyara.
        </p>
      `,
      "Read message",
      `${APP_URL}/messages/${artisanId}/${customerId}`,
    ),
  });

  if (error) {
    logger.error({ err: error }, "Resend: failed to send message notification email");
    res.json({ ok: false });
    return;
  }

  res.json({ ok: true });
});

export default router;
