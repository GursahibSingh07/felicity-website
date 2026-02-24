import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function OngoingEvents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOngoing = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/my-events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEvents(data.filter(e => e.status === "ongoing"));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOngoing();
  }, []);

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEvents(prev => prev.filter(e => e._id !== eventId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Ongoing Events</h1>
          <p style={{ color: "#64748b", margin: "0.3rem 0 0 0", fontSize: "0.9rem" }}>Events currently in progress</p>
        </div>
        <button
          onClick={() => navigate("/organizer/dashboard")}
          style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", padding: "0.4rem 1rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.9rem", color: "#475569", fontWeight: "600" }}
        >
          ← Dashboard
        </button>
      </div>

      {error && <p style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem" }}>{error}</p>}

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ color: "#475569" }}>No ongoing events</h3>
          <p style={{ color: "#94a3b8" }}>Mark a published event as "Ongoing" from your dashboard to see it here.</p>
          <button
            onClick={() => navigate("/organizer/dashboard")}
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600", marginTop: "1rem", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {events.map(event => (
            <div key={event._id} style={{ background: "white", border: "1.5px solid #d1fae5", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 4px 12px rgba(16,185,129,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1e293b", flex: 1, marginRight: "0.5rem" }}>{event.title}</h3>
                <span style={{ background: "#d1fae5", color: "#065f46", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap" }}>
                  Ongoing
                </span>
              </div>

              <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.9" }}>
                <div><strong>📅</strong> {new Date(event.date).toLocaleDateString()}{event.endDate && ` → ${new Date(event.endDate).toLocaleDateString()}`}</div>
                <div><strong>📍</strong> {event.location}</div>
                <div><strong>👥</strong> {event.registrationCount || 0} registered / {event.attendedCount || 0} attended</div>
                <div><strong>💰</strong> Revenue: ₹{event.revenue || 0}</div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <Link
                  to={`/organizer/events/${event._id}`}
                  style={{ background: "#6366f1", color: "white", textDecoration: "none", padding: "0.4rem 0.9rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleStatusChange(event._id, "completed")}
                  style={{ background: "#10b981", color: "white", border: "none", padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatusChange(event._id, "closed")}
                  style={{ background: "#f59e0b", color: "white", border: "none", padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                >
                  Close Event
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OngoingEvents;
