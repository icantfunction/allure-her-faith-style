// src/api/ambassadors.ts

// ===== TYPE DEFINITIONS =====

export type AmbassadorStats = {
  visitCount?: number;
  lastVisitAt?: string | null;
};

export type Ambassador = {
  code: string;
  name: string;
  note?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: AmbassadorStats;
};

export type CreateAmbassadorInput = {
  code: string;
  name: string;
  note?: string;
  active?: boolean;
};

// ===== CONFIG =====

const SITE_ID = import.meta.env.VITE_SITE_ID ?? "my-site";
const API_BASE =
  import.meta.env.VITE_API_BASE ??
  "https://d1pqkh0r4pj29.cloudfront.net";

// LocalStorage key for admin ID token (Cognito JWT)
const ADMIN_TOKEN_KEY = "allureher_admin_token";

// ===== HELPERS =====

function getAdminToken(): string | null {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  auth: "public" | "admin" = "public"
): Promise<T | null> {
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

// POST /analytics/ambassador (track visit)
export async function trackAmbassadorVisit(code: string): Promise<void> {
  await request(
    "/analytics/ambassador",
    {
      method: "POST",
      body: JSON.stringify({
        siteId: SITE_ID,
        code,
      }),
    },
    "public"
  );
}

// ===== ADMIN ENDPOINTS =====

// GET /admin/ambassadors?siteId=...
export async function adminListAmbassadors(): Promise<Ambassador[]> {
  const response = await request<{ items: Ambassador[] }>(
    `/admin/ambassadors?siteId=${encodeURIComponent(SITE_ID)}`,
    {},
    "admin"
  );
  return response?.items ?? [];
}

// POST /admin/ambassadors
export async function adminCreateAmbassador(
  input: CreateAmbassadorInput
): Promise<{ code: string }> {
  return request<{ code: string }>(
    "/admin/ambassadors",
    {
      method: "POST",
      body: JSON.stringify({
        siteId: SITE_ID,
        code: input.code,
        name: input.name,
        note: input.note ?? "",
        active: input.active ?? true,
      }),
    },
    "admin"
  );
}
