// src/api/allureherApi.ts

// ===== TYPE DEFINITIONS =====

export type Subscriber = {
  siteId: string;
  email: string;
  subscribedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  status: "subscribed" | "unsubscribed";
  source?: string | null;
};

export type CampaignStats = {
  totalRecipients: number;
  successCount: number;
  failedCount: number;
};

export type CreateCampaignResponse = {
  campaignId: string;
  stats: CampaignStats;
};

export type Campaign = {
  campaignId: string;
  siteId: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  status: "sent";
  stats: CampaignStats;
};

// ----- Fixed per your backend -----
const SITE_ID = import.meta.env.VITE_SITE_ID ?? "my-site";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// LocalStorage key for admin ID token (Cognito JWT)
const ADMIN_TOKEN_KEY = "allureher_admin_token";

// ===== Helpers =====

function getAdminToken(): string | null {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  auth: "public" | "admin" = "public"
): Promise<T | null> {
  // Skip API call if no API base is configured
  if (!API_BASE) {
    throw new Error("API_BASE not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (auth === "admin") {
    const token = getAdminToken();
    if (!token) {
      throw new Error("No admin token set. Log in or set allureher_admin_token first.");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "omit",
    mode: "cors",
  });

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore parse errors, treat as plain text
  }

  if (!res.ok) {
    const msg =
      (json && (json.error || json.message)) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

// ===== PUBLIC ENDPOINTS =====

// POST /public/email/subscribe  (204 on success)
export async function subscribeEmail(email: string, source = "footer"): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) throw new Error("Email is required");

  const res = await fetch(`${API_BASE}/public/email/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Explicitly avoid credentials for cross-origin to prevent CORS preflight issues
    credentials: "omit",
    mode: "cors",
    body: JSON.stringify({ 
      siteId: SITE_ID, 
      email: trimmed, 
      source 
    }),
  });

  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`Subscribe failed (${res.status}): ${text}`);
  }

  // treat as success (any 2xx status)
}

// POST /public/email/unsubscribe  (204 on success)
export async function unsubscribeEmail(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) throw new Error("Email is required");

  const res = await fetch(`${API_BASE}/public/email/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    mode: "cors",
    body: JSON.stringify({ 
      siteId: SITE_ID, 
      email: trimmed
    }),
  });

  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`Unsubscribe failed (${res.status}): ${text}`);
  }

  // treat as success (any 2xx status)
}

// GET /public/products?siteId=...
export async function listPublicProducts() {
  return request<any[]>(`/public/products?siteId=${encodeURIComponent(SITE_ID)}`);
}

// GET /public/theme?siteId=...
export async function getPublicTheme() {
  // Skip API call if no API base is configured
  if (!API_BASE) {
    return null;
  }
  try {
    return request(`/public/theme?siteId=${encodeURIComponent(SITE_ID)}`);
  } catch (error) {
    // Silently fail - caller will handle null response
    return null;
  }
}

// POST /analytics/visit   (204)
export async function recordVisit() {
  // Skip analytics if API base is not configured
  if (!API_BASE) return;
  
  try {
    await request("/analytics/visit", {
      method: "POST",
      body: JSON.stringify({ siteId: SITE_ID }),
    });
  } catch (error) {
    // Silently fail analytics - don't throw or log errors in production
    // Analytics failures should not impact user experience
    if (import.meta.env.DEV) {
      console.debug("Analytics call failed (expected if backend is unavailable):", error);
    }
  }
}

// ===== ADMIN ENDPOINTS (JWT required) =====
//
// These use Cognito ID token in localStorage under allureher_admin_token
// and hit the JWT-protected /admin/* routes.

// --- Config ---

// GET /admin/config?siteId=...
export async function getAdminConfig() {
  return request(`/admin/config?siteId=${encodeURIComponent(SITE_ID)}`, {}, "admin");
}

// PUT /admin/config   (204)
export async function updateAdminConfig(partialConfig: any): Promise<void> {
  await request(
    "/admin/config",
    {
      method: "PUT",
      body: JSON.stringify({
        siteId: SITE_ID,
        ...partialConfig,
      }),
    },
    "admin"
  );
}

// --- Products ---

// GET /admin/products?siteId=...
export async function adminListProducts() {
  return request<any[]>(`/admin/products?siteId=${encodeURIComponent(SITE_ID)}`, {}, "admin");
}

// POST /admin/products   -> { productId }
export async function adminCreateProduct(input: {
  name: string;
  price: number;
  images?: string[];
  description?: string;
  sku?: string;
}) {
  return request<{ productId: string }>(
    "/admin/products",
    {
      method: "POST",
      body: JSON.stringify({
        siteId: SITE_ID,
        ...input,
      }),
    },
    "admin"
  );
}

// PUT /admin/products/{id}   (204)
export async function adminUpdateProduct(
  productId: string,
  input: {
    name?: string;
    price?: number;
    images?: string[];
    description?: string;
    sku?: string;
  }
): Promise<void> {
  await request(
    `/admin/products/${encodeURIComponent(productId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        siteId: SITE_ID,
        ...input,
      }),
    },
    "admin"
  );
}

// DELETE /admin/products/{id}?siteId=...   (204)
export async function adminDeleteProduct(productId: string): Promise<void> {
  const qs = new URLSearchParams({ siteId: SITE_ID }).toString();
  await request(
    `/admin/products/${encodeURIComponent(productId)}?${qs}`,
    { method: "DELETE" },
    "admin"
  );
}

// --- Email: subscribers & campaigns ---

// GET /admin/email/subscribers?siteId=...
export async function adminListSubscribers() {
  const response = await request<{ items: any[] }>(
    `/admin/email/subscribers?siteId=${encodeURIComponent(SITE_ID)}`,
    {},
    "admin"
  );
  
  // Map backend response (createdAt) to frontend format (subscribedAt)
  return (response?.items || []).map((sub) => ({
    ...sub,
    subscribedAt: sub.subscribedAt || sub.createdAt,
  })) as Subscriber[];
}

// GET /admin/email/campaigns?siteId=...
export async function adminListEmailCampaigns() {
  return request<Campaign[]>(
    `/admin/email/campaigns?siteId=${encodeURIComponent(SITE_ID)}`,
    {},
    "admin"
  );
}

// POST /admin/email/campaigns   (create + send immediately)
export async function adminCreateEmailCampaign(input: {
  subject: string;
  bodyHtml: string;
}) {
  return request<CreateCampaignResponse>(
    "/admin/email/campaigns",
    {
      method: "POST",
      body: JSON.stringify({
        siteId: SITE_ID,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        // sendAt removed - backend only supports immediate send for now
      }),
    },
    "admin"
  );
}

// --- Analytics ---

// GET /admin/analytics/daily?siteId=...&start=YYYY-MM-DD&end=YYYY-MM-DD
export async function adminGetDailyAnalytics(startISO: string, endISO: string) {
  const qs = new URLSearchParams({
    siteId: SITE_ID,
    start: startISO,
    end: endISO,
  }).toString();

  return request<any[]>(`/admin/analytics/daily?${qs}`, {}, "admin");
}

// --- Image Presign ---

// POST /admin/images/presign
export async function adminPresignImage(fileName: string, contentType: string) {
  return request<{ key: string; uploadUrl: string; publicUrl: string }>(
    "/admin/images/presign",
    {
      method: "POST",
      body: JSON.stringify({ siteId: SITE_ID, fileName, contentType }),
    },
    "admin"
  );
}

// ===== Dev helper: manually set admin token =====

export function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}
