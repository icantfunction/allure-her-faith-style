export type AbandonedCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  size?: string;
};

export type AbandonedCartPayload = {
  siteId: string;
  cartId: string;
  email: string;
  firstName: string;
  lastName: string;
  items: AbandonedCartItem[];
  source?: string;
};

export type AbandonedCartResponse = {
  siteId: string;
  cartId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  items?: AbandonedCartItem[];
  updatedAt?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
let abandonedCartEnabled = true;

const shouldDisable = (status: number) => status === 401 || status === 403 || status === 404;

export async function syncAbandonedCart(payload: AbandonedCartPayload) {
  if (!API_BASE || !abandonedCartEnabled) return null;
  const res = await fetch(`${API_BASE}/public/abandoned-cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    mode: "cors",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (shouldDisable(res.status)) {
      abandonedCartEnabled = false;
      return null;
    }
    const message = await res.text().catch(() => "");
    throw new Error(message || `Cart sync failed (${res.status})`);
  }

  return res.json().catch(() => null);
}

export async function fetchAbandonedCart(siteId: string, cartId: string) {
  if (!API_BASE || !abandonedCartEnabled) return null;
  if (!cartId) return null;
  const qs = new URLSearchParams({ siteId, cartId }).toString();
  const res = await fetch(`${API_BASE}/public/abandoned-cart?${qs}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    mode: "cors",
  });

  if (res.status === 404) {
    abandonedCartEnabled = false;
    return null;
  }
  if (res.status === 401 || res.status === 403) {
    abandonedCartEnabled = false;
    return null;
  }
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Cart lookup failed (${res.status})`);
  }

  return (await res.json()) as AbandonedCartResponse;
}
