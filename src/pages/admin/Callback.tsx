import React from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "../../lib/auth";

export default function Callback() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;
    handleCallback(code)
      .then(() => navigate("/admin", { replace: true }))
      .catch((e) => alert(e.message));
  }, [navigate]);
  return <p className="admin-wrap">Completing sign-in…</p>;
}
