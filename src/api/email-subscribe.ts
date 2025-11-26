const API_BASE = import.meta.env.VITE_API_BASE as string;
const SITE_ID = import.meta.env.VITE_SITE_ID as string;

export async function subscribeToEmails(email: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/email-subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      siteId: SITE_ID,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Subscription failed");
  }

  return res.json();
}
