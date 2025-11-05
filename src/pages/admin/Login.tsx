import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function AdminLogin() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(username.trim(), password);
      const to = (loc.state as any)?.from ?? "/admin";
      nav(to, { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-card" style={{ maxWidth: 420, margin: "64px auto" }}>
        <h1>Admin Login</h1>
        <form onSubmit={onSubmit} className="admin-grid admin-grid-small">
          <label>
            Email
            <input value={username} onChange={(e) => setU(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setP(e.target.value)} required />
          </label>
          <button className="admin-btn" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}
      </div>
    </div>
  );
}
