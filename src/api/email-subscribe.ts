const API_BASE = import.meta.env.VITE_API_BASE || 'https://90rzuoiw2c.execute-api.us-east-1.amazonaws.com/prod';

export async function subscribeToEmails(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/public/email/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      siteId: 'my-site',
    }),
    credentials: 'include',
  });

  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!res.ok) {
    throw new Error(`Subscribe failed (${res.status}): ${text}`);
  }

  // treat as success
  return;
}
