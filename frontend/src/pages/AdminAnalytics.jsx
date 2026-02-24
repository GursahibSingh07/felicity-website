import { useEffect, useState } from "react";

function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();
      setData(result);
    };

    fetchData();
  }, []);

  if (!data) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>System Analytics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
        {[
          { label: "Total Events", value: data.totalEvents, color: "#6366f1" },
          { label: "Total Registrations", value: data.totalRegistrations, color: "#10b981" },
          { label: "Total Users", value: data.totalUsers, color: "#f59e0b" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "1.5rem", textAlign: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.06)" }}>
            <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "0.3rem" }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminAnalytics;
