import React from "react";
import { AdminAPI } from "../../lib/api";
import { getIdToken, requireAuth } from "../../lib/auth";

function iso(d: Date){ return d.toISOString().slice(0,10); }

export default function Analytics() {
  const [rows, setRows] = React.useState<{date:string; count:number}[]>([]);
  React.useEffect(()=>{
    requireAuth();
    const end = new Date();
    const start = new Date(Date.now() - 7*24*3600*1000);
    const token = getIdToken()!;
    AdminAPI.dailyAnalytics(token, iso(start), iso(end)).then(setRows);
  }, []);
  return (
    <div className="admin-wrap">
      <h1>Analytics (7 days)</h1>
      <table cellPadding={6} style={{ borderCollapse: "collapse", border: "1px solid #eee" }}>
        <thead><tr><th>Date</th><th>Visits</th></tr></thead>
        <tbody>
          {rows.map(r=> <tr key={r.date}><td>{r.date}</td><td>{r.count}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
