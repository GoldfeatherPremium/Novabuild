import { billingConfig } from "@/lib/env";

/**
 * Billing provider abstraction. Currently supports Stripe via its REST API
 * (no SDK dependency). Billing runs in TEST MODE until production keys are
 * configured — the webhook verifies signatures and entitlements are granted
 * server-side only.
 */
export interface BillingProvider {
  name: string;
  testMode: boolean;
  createCheckoutSession(input: {
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<{ url: string }>;
  createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;
  createCustomer(input: { email: string; userId: string }): Promise<{ customerId: string }>;
}

export class StripeProvider implements BillingProvider {
  readonly name = "stripe";
  readonly testMode: boolean;

  constructor(private secretKey: string) {
    this.testMode = secretKey.startsWith("sk_test_");
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body ? new URLSearchParams(flatten(body)).toString() : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Stripe error ${res.status}: ${text.slice(0, 300)}`);
    }
    return res.json() as Promise<T>;
  }

  async createCustomer(input: { email: string; userId: string }) {
    const data = await this.request<{ id: string }>("POST", "/customers", {
      email: input.email,
      metadata: { user_id: input.userId },
    });
    return { customerId: data.id };
  }

  async createCheckoutSession(input: {
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }) {
    const data = await this.request<{ url: string }>("POST", "/checkout/sessions", {
      mode: "subscription",
      customer_email: input.customerEmail,
      line_items: JSON.stringify([{ price: input.priceId, quantity: 1 }]),
      metadata: input.metadata,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      allow_promotion_codes: "true",
    });
    return { url: data.url };
  }

  async createPortalSession(customerId: string, returnUrl: string) {
    const data = await this.request<{ url: string }>("POST", "/billing_portal/sessions", {
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: data.url };
  }
}

function flatten(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = String(value);
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => {
        out[`${key}[${i}]`] = typeof v === "object" ? JSON.stringify(v) : String(v);
      });
    } else if (value !== null && value !== undefined) {
      out[key] = JSON.stringify(value);
    }
  }
  return out;
}

export function getBillingProvider(): BillingProvider | null {
  const cfg = billingConfig();
  if (!cfg.configured) return null;
  const key = process.env.BILLING_SECRET_KEY ?? "";
  if (!key) return null;
  return new StripeProvider(key);
}
