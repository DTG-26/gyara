---
name: Email verification
description: How Gyara's Resend-based email verification flow works
---

## Design

Stateless HMAC tokens — no DB table needed for tokens.

- Token = `base64url(userId.expiry.hmac_sha256(userId.expiry, SESSION_SECRET))`
- 24-hour TTL
- API server generates + validates entirely; Supabase never sees the token

## Endpoints (API server)

- `POST /api/auth/send-verification` — body: `{userId, email, name}`. Generates token, sends via Resend from `hello@maigyara.com`.
- `GET /api/auth/verify?token=` — validates HMAC + expiry, calls `mark_email_verified(p_user_id)` Supabase RPC.

## Supabase side

- `profiles.email_verified boolean DEFAULT false` — added via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `mark_email_verified(p_user_id uuid)` — SECURITY DEFINER, `GRANT EXECUTE TO anon` so API server's anon key can call it

**Why:** Service role key not available as a secret; using a SECURITY DEFINER RPC called by the anon key is safe because the API server is the gatekeeper (token validated before RPC call).

## Frontend

- Signup fires `fetch('/api/auth/send-verification', ...)` non-blocking after account creation
- `/verify?token=` page calls `GET /api/auth/verify` on mount, shows loading/success/error
