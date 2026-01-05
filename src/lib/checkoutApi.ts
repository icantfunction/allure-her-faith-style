// src/lib/checkoutApi.ts
type Address = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string; // default 'US'
};

export type ShippingQuote = {
  success: boolean;
  shippingAmountCents: number;
  rate: number;
  currency: string;
  carrier: string;
  service: string;
  deliveryDays?: number;
  quantity: number;
  totalWeight: number;
  boxHeight: number;
};

const SHIPPING_API_URL =
  import.meta.env.VITE_SHIPPING_API_URL ??
  "https://1f7dvduzvg.execute-api.us-east-1.amazonaws.com/calculate-shipping";

const CHECKOUT_ENDPOINT =
  import.meta.env.VITE_CHECKOUT_ENDPOINT ??
  "https://90rzuoiw2c.execute-api.us-east-1.amazonaws.com/prod/admin/checkout/create-session";

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, cancel: () => clearTimeout(id) };
}

// In-memory cache for shipping quotes (session-only)
const shippingQuoteCache = new Map<string, { quote: ShippingQuote; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getShippingCacheKey(quantity: number | undefined, address: Address): string {
  return `${address.line1}|${address.city}|${address.state}|${address.postal_code}|${address.country || "US"}|${quantity ?? 1}`;
}

export async function calculateShipping(input: { quantity?: number; address: Address }): Promise<ShippingQuote> {
  const cacheKey = getShippingCacheKey(input.quantity, input.address);
  
  // Check cache first
  const cached = shippingQuoteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.quote;
  }

  const { controller, cancel } = withTimeout(10_000);
  try {
    const res = await fetch(SHIPPING_API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Shipping failed (${res.status})`);
    
    const quote = data as ShippingQuote;
    
    // Cache the successful result
    shippingQuoteCache.set(cacheKey, { quote, timestamp: Date.now() });
    
    return quote;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Shipping calculation timed out. Please try again.");
    }
    throw err;
  } finally {
    cancel();
  }
}

export type StripeLineItem = {
  quantity: number;
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description?: string;
      images?: string[];
    };
    unit_amount: number; // Amount in cents
  };
};

export async function createCheckoutSession(input: {
  lineItems: StripeLineItem[];
  mode: "payment" | "subscription";
  siteId: string;

  // send these now (backend can ignore until wired)
  shippingCostCents?: number;
  shippingAddress?: Address;
  shippingQuote?: ShippingQuote;
}) {
  const { controller, cancel } = withTimeout(10_000);
  try {
    const res = await fetch(CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // IMPORTANT: your admin API has AllowCredentials=true, so keep this:
      credentials: "include",
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Checkout failed (${res.status})`);

    const url = data?.url;
    if (!url) throw new Error("Checkout response missing url");
    return { url, raw: data };
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Checkout request timed out. Please try again.");
    }
    throw err;
  } finally {
    cancel();
  }
}
