import React from "react";
import { Link } from "react-router-dom";
import { requireAuth, getIdToken, signOut } from "../../lib/auth";

export default function AdminHome() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => { requireAuth(); setReady(true); }, []);
  if (!ready) return null;

  const token = getIdToken();
  if (!token) return null;

  return (
    <div className="admin-wrap">
      <h1>Admin Panel</h1>
      <p>Authenticated. Choose a tool:</p>
      <ul className="admin-menu">
        <li><Link to="/admin/products">Products</Link></li>
        <li><Link to="/admin/config">Site Config</Link></li>
        <li><Link to="/admin/analytics">Analytics (7d)</Link></li>
      </ul>
      <button onClick={signOut} className="admin-btn">Sign out</button>
    </div>
  );
}
