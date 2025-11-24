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

export type CheckoutSessionResponse = {
  id: string;
  url: string;
};

export const createCheckoutSession = async (payload: {
  lineItems: any[];
  mode?: string;
}) => {
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

