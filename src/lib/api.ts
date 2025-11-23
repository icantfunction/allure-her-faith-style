const API_BASE = import.meta.env.VITE_API_BASE as string;
const SITE_ID = import.meta.env.VITE_SITE_ID as string;

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
  
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${msg}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const PublicAPI = {
  listProducts: () =>
    fetch(`${API_BASE}/public/products?siteId=${encodeURIComponent(SITE_ID)}`).then(r => r.json()),
  getProduct: (id: string) =>
    fetch(`${API_BASE}/public/products/${encodeURIComponent(id)}?siteId=${encodeURIComponent(SITE_ID)}`).then(r => r.json()),
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
};
