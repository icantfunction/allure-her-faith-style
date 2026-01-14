const API_BASE = import.meta.env.VITE_API_BASE || 'https://d1pqkh0r4pj29.cloudfront.net';

export async function subscribeToEmails(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/public/email/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      siteId: 'my-site',
    }),
    credentials: "omit",
    mode: "cors",
  });

  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`Subscribe failed (${res.status}): ${text}`);
  }

  // treat as success (any 2xx status)
  return;
}
