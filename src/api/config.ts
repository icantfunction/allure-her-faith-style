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

export interface ThemeConfig {
  primary?: string;
  accent?: string;
}

export interface PopupConfig {
  enabled: boolean;
  title?: string;
  message?: string;
  ctaText?: string;
  ctaUrl?: string;
  delaySeconds?: number;
}

export interface BannerConfig {
  enabled: boolean;
  text?: string;
  discountCode?: string;
  linkUrl?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface SiteConfigResponse {
  siteId: string;
  theme?: ThemeConfig;
  popup?: PopupConfig;
  banner?: BannerConfig;
}

// ---------- PUBLIC: GET /public/theme ----------

export async function getPublicConfig(): Promise<SiteConfigResponse> {
  const res = await fetch(
    `${API_BASE}/public/theme?siteId=${encodeURIComponent(SITE_ID)}`
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`getPublicConfig failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ---------- ADMIN: PUT /admin/config ----------

interface AdminUpdateConfigInput {
  theme?: ThemeConfig;
  popup?: PopupConfig;
  banner?: BannerConfig;
}

/**
 * Update site config (theme / popup / banner).
 * All fields are optional; only the ones you pass get replaced.
 */
export async function adminUpdateConfig(
  input: AdminUpdateConfigInput
): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const body: any = {
    siteId: SITE_ID,
  };

  if (input.theme) body.theme = input.theme;
  if (input.popup) body.popup = input.popup;
  if (input.banner) body.banner = input.banner;

  const res = await fetch(`${API_BASE}/admin/config`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized");
  }

  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(`adminUpdateConfig failed (${res.status}): ${text}`);
  }

  // 204 = success, no content
}
