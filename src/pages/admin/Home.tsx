import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function AdminHome() {
  const { signOut } = useAuth();

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
