import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  MAX_WEBHOOK_AGE_SECONDS,
  isEventFresh,
  parseStripeSignature,
  verifyStripeSignature,
} from "@/lib/billing/webhook";

const SECRET = "whsec_test_secret_123";

function sign(payload: string, secret: string, t: number): string {
  const hmac = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return `t=${t},v1=${hmac}`;
}

describe("parseStripeSignature", () => {
  it("parses timestamp and v1 pieces", () => {
    const parsed = parseStripeSignature("t=1000,v1=abc,v0=def");
    expect(parsed.t).toBe("1000");
    expect(parsed.v1).toBe("abc");
  });

  it("returns empty strings when pieces are missing", () => {
    const parsed = parseStripeSignature("v1=abc");
    expect(parsed.t).toBe("");
    expect(parsed.v1).toBe("abc");
    const empty = parseStripeSignature("");
    expect(empty.t).toBe("");
    expect(empty.v1).toBe("");
  });
});

describe("verifyStripeSignature", () => {
  const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const t = Math.floor(Date.now() / 1000);

  it("accepts a valid signature", () => {
    expect(verifyStripeSignature(payload, sign(payload, SECRET, t), SECRET)).toBe(true);
  });

  it("rejects a signature made with a different secret", () => {
    const wrong = sign(payload, "whsec_wrong", t);
    expect(verifyStripeSignature(payload, wrong, SECRET)).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const signature = sign(payload, SECRET, t);
    expect(verifyStripeSignature(payload + " ", signature, SECRET)).toBe(false);
  });

  it("rejects missing timestamp or v1", () => {
    expect(verifyStripeSignature(payload, "v1=abc", SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${t}`, SECRET)).toBe(false);
  });

  it("rejects malformed signatures without throwing", () => {
    expect(verifyStripeSignature(payload, "not-a-signature", SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, "", SECRET)).toBe(false);
  });

  it("rejects non-hex v1 value", () => {
    expect(verifyStripeSignature(payload, `t=${t},v1=zzzz`, SECRET)).toBe(false);
  });
});

describe("isEventFresh", () => {
  const now = Date.now() / 1000;

  it("accepts current events", () => {
    expect(isEventFresh(Math.floor(now))).toBe(true);
  });

  it("rejects events older than the freshness window", () => {
    const old = now - MAX_WEBHOOK_AGE_SECONDS - 10;
    expect(isEventFresh(old)).toBe(false);
  });

  it("accepts events within the window", () => {
    const recent = now - 60;
    expect(isEventFresh(recent)).toBe(true);
  });

  it("rejects unparseable timestamps", () => {
    expect(isEventFresh(Number.NaN)).toBe(false);
  });
});
