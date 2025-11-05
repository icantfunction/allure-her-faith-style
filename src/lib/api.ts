export const API_BASE = import.meta.env.VITE_API_BASE as string;
export const SITE_ID  = import.meta.env.VITE_SITE_ID as string;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${msg}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const PublicAPI = {
  listProducts: () =>
    http<any[]>(`/public/products?siteId=${encodeURIComponent(SITE_ID)}`),
  getProduct: (id: string) =>
    http<any>(`/public/products/${encodeURIComponent(id)}?siteId=${encodeURIComponent(SITE_ID)}`),
};

export const AdminAPI = {
  dailyAnalytics: (token: string, start: string, end: string) =>
    http<any[]>(`/admin/analytics/daily?siteId=${encodeURIComponent(SITE_ID)}&start=${start}&end=${end}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateTheme: (token: string, theme: any) =>
    http<void>(`/admin/config`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ siteId: SITE_ID, theme }),
    }),
  presignImage: (token: string, fileName: string, contentType: string) =>
    http<{ key: string; uploadUrl: string; publicUrl: string }>(`/admin/images/presign`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ siteId: SITE_ID, fileName, contentType }),
    }),
  createProduct: (token: string, p: { name: string; price: number; images?: string[]; description?: string; sku?: string }) =>
    http<{ productId: string }>(`/admin/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ siteId: SITE_ID, ...p }),
    }),
  updateProduct: (token: string, id: string, p: Partial<{ name: string; price: number; images: string[]; description: string; sku: string }>) =>
    http<void>(`/admin/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ siteId: SITE_ID, ...p }),
    }),
};
