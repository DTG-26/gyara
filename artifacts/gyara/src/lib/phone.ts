/**
 * Normalizes a Nigerian phone number string to its 13-digit international form
 * (234 followed by 10 digits, no leading +).
 *
 * Accepts:
 *   +2348031234567  → "2348031234567"
 *   2348031234567   → "2348031234567"
 *   08031234567     → "2348031234567"
 *   8031234567      → "2348031234567"
 *
 * Returns null when the input cannot be normalized to exactly 13 digits.
 */
export function normalizeNigerianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let normalized: string;
  if (digits.startsWith("234")) {
    normalized = digits;
  } else if (digits.startsWith("0")) {
    normalized = "234" + digits.slice(1);
  } else if (digits.length === 10) {
    normalized = "234" + digits;
  } else {
    return null;
  }

  return normalized.length === 13 ? normalized : null;
}

/**
 * Returns true when the raw input normalizes to a valid 13-digit Nigerian
 * mobile number (country code 234 + 10 digits).
 */
export function isValidNigerianPhone(raw: string): boolean {
  return normalizeNigerianPhone(raw.trim()) !== null;
}
