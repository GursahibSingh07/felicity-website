import { useEffect, useState } from "react";

function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/events/analytics",
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
    <div style={{ padding: "2rem" }}>
      <h1>System Analytics</h1>
      <p>Total Events: {data.totalEvents}</p>
      <p>Total Registrations: {data.totalRegistrations}</p>
      <p>Total Users: {data.totalUsers}</p>
    </div>
  );
}

export default AdminAnalytics;
