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

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to subscribe (status ${res.status})`);
  }
}
