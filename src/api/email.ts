const API_BASE_URL = "https://90rzuoiw2c.execute-api.us-east-1.amazonaws.com/prod";
const SITE_ID = "my-site";

export type Subscriber = {
  email: string;
  createdAt: string;
  updatedAt: string;
  source: string | null;
};

export type CampaignStats = {
  totalRecipients: number;
  successCount: number;
  failedCount: number;
};

export type Campaign = {
  siteId: string;
  campaignId: string;
  name: string;
  subject: string;
  bodyHtml: string;
  sendAt?: string | null;
  status: "draft" | "sent" | "failed";
  createdAt: string;
  updatedAt: string;
  stats?: CampaignStats;
};

export type CreateCampaignResponse = {
  campaignId: string;
  status: "draft" | "sent" | "failed";
  stats?: CampaignStats;
};

async function getAuthToken(): Promise<string | null> {
  try {
    const mod = await import("@/auth/cognito");
    return await mod.getIdToken();
  } catch {
    return null;
  }
}

export async function adminListSubscribers() {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${API_BASE_URL}/admin/email/subscribers?siteId=${SITE_ID}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "omit",
      mode: "cors",
    }
  );
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load subscribers: ${res.status} ${text}`);
  }
  
  const json = await res.json();
  
  // Backend returns array directly: [{ email, status, createdAt }, ...]
  // Handle both array response and legacy { items: [...] } format
  if (Array.isArray(json)) {
    return {
      items: json as Subscriber[],
      nextToken: null,
    };
  }
  
  return json as {
    items: Subscriber[];
    nextToken: string | null;
  };
}

export async function adminListAllSubscribers(): Promise<Subscriber[]> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const allSubscribers: Subscriber[] = [];
  let nextToken: string | null = null;
  let loopGuard = 0;
  const MAX_PAGES = 100;

  do {
    const url = new URL(`${API_BASE_URL}/admin/email/subscribers`);
    url.searchParams.set("siteId", SITE_ID);
    if (nextToken) {
      url.searchParams.set("nextToken", nextToken);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "omit",
      mode: "cors",
    });

    if (res.status === 403) {
      throw new Error(
        `Access forbidden. Verify SITE_ID matches backend configuration ("my-site").`
      );
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to load subscribers: ${res.status} ${text}`);
    }

    const json = await res.json();
    
    // Backend returns array directly: [{ email, status, createdAt }, ...]
    // Handle both array response and legacy { items: [...] } format
    if (Array.isArray(json)) {
      allSubscribers.push(...json);
      nextToken = null; // Array response means no pagination
    } else {
      allSubscribers.push(...(json.items || []));
      nextToken = json.nextToken;
    }
    loopGuard++;

    if (loopGuard >= MAX_PAGES) {
      console.warn(`Reached maximum pagination limit (${MAX_PAGES} pages). There may be more subscribers.`);
      break;
    }
  } while (nextToken);

  return allSubscribers;
}

export async function adminListCampaigns() {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${API_BASE_URL}/admin/email/campaigns?siteId=${SITE_ID}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "omit",
      mode: "cors",
    }
  );
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load campaigns: ${res.status} ${text}`);
  }
  
  const json = await res.json();
  return json as Campaign[];
}

export async function adminCreateCampaign(input: {
  name: string;
  subject: string;
  bodyHtml: string;
  sendAtUtc?: string;
}) {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const body: any = {
    siteId: SITE_ID,
    name: input.name,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
  };
  
  if (input.sendAtUtc) {
    body.sendAt = input.sendAtUtc;
  }

  const res = await fetch(`${API_BASE_URL}/admin/email/campaigns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "omit",
    mode: "cors",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create campaign: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json as CreateCampaignResponse;
}

export function localToUtcIso(local: string): string {
  // local is "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = local.split("T");
  if (!datePart || !timePart) throw new Error("Invalid datetime");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const dt = new Date(year, month - 1, day, hour, minute, 0);
  return dt.toISOString();
}
