const API_BASE = import.meta.env.VITE_API_BASE ?? "https://90rzuoiw2c.execute-api.us-east-1.amazonaws.com/prod";
const SITE_ID = import.meta.env.VITE_SITE_ID ?? "my-site";

// Shipping API endpoint
const SHIPPING_API_URL = import.meta.env.VITE_SHIPPING_API_URL ?? 
  "https://1f7dvduzvg.execute-api.us-east-1.amazonaws.com/calculate-shipping";

async function getAuthToken(): Promise<string | null> {
  try {
    const mod = await import("@/auth/cognito");
    return await mod.getIdToken();
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}${path}`, { 
    ...init, 
    headers,
    credentials: "omit",
    mode: "cors",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }

  // treat as success (any 2xx status)
  if (res.status === 204 || !text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { raw: text } as T;
  }
}

// Types
export type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export type ShippingQuote = {
  success: true;
  shippingAmountCents: number;
  rate: number;
  currency: string;
  carrier: string;
  service: string;
  deliveryDays: number | null;
  quantity: number;
  totalWeight: number;
  boxHeight: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  weight?: number;
};

export type Order = {
  orderId: string;
  siteId?: string;
  customerName: string;
  email: string;
  phone?: string;
  status: string;
  total: number;
  subtotal?: number;
  shippingCost?: number;
  taxAmount?: number;
  currency?: string;
  shippingMethod?: string;
  labelGeneratedAt?: string;
  trackingId?: string;
  createdAt?: string;
  updatedAt?: string;
  hasLabel?: boolean;
  items?: OrderItem[];
  totalQuantity?: number;
  totalWeight?: number;
  shippingAddress?: ShippingAddress;
  notes?: string;
};

export const PublicAPI = {
  listProducts: () =>
    fetch(`${API_BASE}/public/products?siteId=${encodeURIComponent(SITE_ID)}`, {
      credentials: "omit",
      mode: "cors",
    }).then(r => r.json()),
  getProduct: (id: string) =>
    fetch(`${API_BASE}/public/products/${encodeURIComponent(id)}?siteId=${encodeURIComponent(SITE_ID)}`, {
      credentials: "omit",
      mode: "cors",
    }).then(r => r.json()),
};

export const AdminAPI = {
  dailyAnalytics: (start: string, end: string) =>
    apiFetch<any[]>(`/admin/analytics/daily?siteId=${encodeURIComponent(SITE_ID)}&start=${start}&end=${end}`),
  
  updateTheme: (theme: any) =>
    apiFetch<void>(`/admin/config`, {
      method: "PUT",
      body: JSON.stringify({ siteId: SITE_ID, theme }),
    }),
  
  presignImage: (fileName: string, contentType: string) =>
    apiFetch<{ key: string; uploadUrl: string; publicUrl: string }>(`/admin/images/presign`, {
      method: "POST",
      body: JSON.stringify({ siteId: SITE_ID, fileName, contentType }),
    }),
  
  createProduct: (p: { name: string; price: number; images?: string[]; description?: string; sku?: string }) =>
    apiFetch<{ productId: string }>(`/admin/products`, {
      method: "POST",
      body: JSON.stringify({ siteId: SITE_ID, ...p }),
    }),
  
  updateProduct: (id: string, p: Partial<{ name: string; price: number; images: string[]; description: string; sku: string; visible: boolean }>) =>
    apiFetch<void>(`/admin/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ siteId: SITE_ID, ...p }),
    }),
  
  deleteProduct: (id: string) =>
    apiFetch<void>(`/admin/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      body: JSON.stringify({ siteId: SITE_ID }),
    }),
  
  // Orders
  listOrders: async (params: Partial<{ 
    status: string; 
    method: string; 
    hasLabel: boolean; 
    q: string; 
    nextToken: string; 
    limit: number; 
    from: string; 
    to: string 
  }>) => {
    const search = new URLSearchParams();
    search.set("siteId", SITE_ID);
    if (params.status) search.set("status", params.status);
    if (params.method) search.set("method", params.method);
    if (params.hasLabel !== undefined) search.set("hasLabel", String(params.hasLabel));
    if (params.q) search.set("q", params.q);
    if (params.nextToken) search.set("nextToken", params.nextToken);
    if (params.limit) search.set("limit", String(params.limit));
    if (params.from) search.set("from", params.from);
    if (params.to) search.set("to", params.to);
    
    const response = await apiFetch<{ items: Order[]; nextToken?: string } | Order[]>(
      `/admin/orders?${search.toString()}`
    );
    
    // Handle both array response and { items: [...] } format
    if (Array.isArray(response)) {
      return { items: response, nextToken: undefined };
    }
    return response;
  },
  
  getOrder: (orderId: string) =>
    apiFetch<Order>(`/admin/orders/${encodeURIComponent(orderId)}?siteId=${encodeURIComponent(SITE_ID)}`),
  
  bulkPrintLabels: (payload: { orderIds: string[]; storeName: string; carrier?: string; format?: string }) =>
    apiFetch<{ pdfUrl?: string; updated?: any[] }>(`/admin/orders/bulk-print-labels`, {
      method: "POST",
      body: JSON.stringify({ siteId: SITE_ID, ...payload }),
    }),
  
  updateOrderStatus: (orderId: string, status: string) =>
    apiFetch<void>(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: "POST",
      body: JSON.stringify({ siteId: SITE_ID, status }),
    }),
};

// Shipping Calculator API
export type ShippingRequest = {
  orderId?: string;
  quantity?: number;
  address: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
  };
};

// In-memory cache for shipping quotes (session-only)
const shippingQuoteCache = new Map<string, { quote: ShippingQuote; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getShippingCacheKey(params: ShippingRequest): string {
  const { address, quantity = 1 } = params;
  return `${address.line1}|${address.city}|${address.state}|${address.postal_code}|${address.country || "US"}|${quantity}`;
}

export async function calculateShipping(params: ShippingRequest): Promise<ShippingQuote> {
  const cacheKey = getShippingCacheKey(params);
  
  // Check cache first
  const cached = shippingQuoteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.quote;
  }

  // AbortController with 8s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(SHIPPING_API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        orderId: params.orderId,
        quantity: params.quantity ?? 1,
        address: params.address,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Shipping API error ${res.status}`);
    }

    const quote = data as ShippingQuote;
    
    // Cache the successful result
    shippingQuoteCache.set(cacheKey, { quote, timestamp: Date.now() });
    
    return quote;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Shipping calculation timed out. Please try again.");
    }
    throw err;
  }
}

// Convenience alias for external usage
export const getShippingQuote = calculateShipping;
