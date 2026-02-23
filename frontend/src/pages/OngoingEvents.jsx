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
        const res = await fetch("http://localhost:5000/api/events/my-events", {
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
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/status`, {
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

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Ongoing Events</h1>
          <p style={{ color: "#666", margin: "0.3rem 0 0 0", fontSize: "0.9rem" }}>Events currently in progress</p>
        </div>
        <button
          onClick={() => navigate("/organizer/dashboard")}
          style={{ background: "none", border: "1px solid #ccc", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}
        >
          ← Dashboard
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#f9f9f9", borderRadius: "12px" }}>
          <h3 style={{ color: "#666" }}>No ongoing events</h3>
          <p style={{ color: "#999" }}>Mark a published event as "Ongoing" from your dashboard to see it here.</p>
          <button
            onClick={() => navigate("/organizer/dashboard")}
            style={{ background: "#007bff", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "1rem" }}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {events.map(event => (
            <div key={event._id} style={{ background: "white", border: "2px solid #d1e7dd", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#333", flex: 1, marginRight: "0.5rem" }}>{event.title}</h3>
                <span style={{ background: "#d1e7dd", color: "#0f5132", padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
                  Ongoing
                </span>
              </div>

              <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: "1.9" }}>
                <div><strong>📅</strong> {new Date(event.date).toLocaleDateString()}{event.endDate && ` → ${new Date(event.endDate).toLocaleDateString()}`}</div>
                <div><strong>📍</strong> {event.location}</div>
                <div><strong>👥</strong> {event.registrationCount || 0} registered / {event.attendedCount || 0} attended</div>
                <div><strong>💰</strong> Revenue: ₹{event.revenue || 0}</div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <Link
                  to={`/organizer/events/${event._id}`}
                  style={{ background: "#007bff", color: "white", textDecoration: "none", padding: "0.4rem 0.9rem", borderRadius: "5px", fontSize: "0.85rem", fontWeight: "bold" }}
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleStatusChange(event._id, "completed")}
                  style={{ background: "#28a745", color: "white", border: "none", padding: "0.4rem 0.9rem", borderRadius: "5px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatusChange(event._id, "closed")}
                  style={{ background: "#fd7e14", color: "white", border: "none", padding: "0.4rem 0.9rem", borderRadius: "5px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
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
