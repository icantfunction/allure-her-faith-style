export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type CheckoutItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

// Stripe line item format with inline price data
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

export type CheckoutSessionResponse = {
  id: string;
  url: string;
};

export type CheckoutCustomerPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

export type CheckoutShippingPayload = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
};

export type CreateCheckoutPayload = {
  lineItems: StripeLineItem[];
  mode?: string;
  siteId: string;
  customer?: CheckoutCustomerPayload;
  shippingAddress?: CheckoutShippingPayload;
  shippingCostCents?: number;
  carrier?: string;
  service?: string;
  deliveryDays?: number | null;
  totalWeight?: number;
};

export const createCheckoutSession = async (payload: CreateCheckoutPayload) => {
  const endpoint = import.meta.env.VITE_CHECKOUT_ENDPOINT;
  if (!endpoint) {
    throw new Error("Checkout endpoint missing. Set VITE_CHECKOUT_ENDPOINT in your env.");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, mode: payload.mode || "payment" }),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "Failed to create checkout session");
    throw new Error(message || "Failed to create checkout session");
  }

  return (await res.json()) as CheckoutSessionResponse;
};

export const confirmCheckoutSession = async (sessionId: string) => {
  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  const apiBase = import.meta.env.VITE_API_BASE || "https://d1pqkh0r4pj29.cloudfront.net";
  const res = await fetch(`${apiBase}/public/checkout/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    mode: "cors",
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "Failed to confirm checkout session");
    throw new Error(message || "Failed to confirm checkout session");
  }

  return res.json().catch(() => ({}));
};
