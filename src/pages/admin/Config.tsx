import React from "react";
import { AdminAPI } from "../../lib/api";

export default function Config() {
  const [primary, setPrimary] = React.useState("#3948AB");
  const [accent, setAccent] = React.useState("#FDB924");

  async function save() {
    try {
      await AdminAPI.updateTheme({ primary, accent });
      alert("Theme updated");
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="admin-wrap">
      <h1>Site Config</h1>
      <div className="admin-grid admin-grid-small">
        <label>Primary <input value={primary} onChange={(e) => setPrimary(e.target.value)} /></label>
        <label>Accent <input value={accent} onChange={(e) => setAccent(e.target.value)} /></label>
        <button onClick={save} className="admin-btn">Save</button>
      </div>
    </div>
  );
}
