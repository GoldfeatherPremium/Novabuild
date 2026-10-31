import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe webhook verification helpers (pure — unit-testable).
 *
 * The handler in app/api/billing/webhook/route.ts relies on these for
 * signature verification and replay protection. Keeping them here lets the
 * security-critical logic be tested without a running server.
 */

export const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

export interface StripeSignatureParts {
  v1: string;
  t: string;
}

export function parseStripeSignature(signature: string): StripeSignatureParts {
  const parts = signature.split(",").reduce<Record<string, string>>((acc, p) => {
    const idx = p.indexOf("=");
    if (idx === -1) return acc;
    acc[p.slice(0, idx)] = p.slice(idx + 1);
    return acc;
  }, {});
  return { v1: parts.v1 ?? "", t: parts.t ?? "" };
}

/**
 * Verify a Stripe webhook signature (HMAC-SHA256 over `${timestamp}.${payload}`).
 * Uses timing-safe comparison. Returns false on any malformed input.
 */
export function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const { v1, t } = parseStripeSignature(signature);
    if (!v1 || !t) return false;
    const hmac = createHmac("sha256", secret).update(`${t}.${payload}`).digest();
    const provided = Buffer.from(v1, "hex");
    return hmac.length === provided.length && timingSafeEqual(hmac, provided);
  } catch {
    return false;
  }
}

/**
 * Replay protection: reject events older than the freshness window (or with
 * an unparseable timestamp). Mirrors the handler's original semantics.
 */
export function isEventFresh(createdSeconds: number, maxAgeSeconds = MAX_WEBHOOK_AGE_SECONDS): boolean {
  const ageSeconds = Date.now() / 1000 - createdSeconds;
  return !Number.isNaN(ageSeconds) && ageSeconds <= maxAgeSeconds;
}
