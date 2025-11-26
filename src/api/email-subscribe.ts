const API_BASE = import.meta.env.VITE_API_BASE as string;

export async function subscribeToEmails(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error("Failed to subscribe");
  }
}
