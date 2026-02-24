import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const STATUS_COLORS = {
  draft:      { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  published:  { bg: "#e0f2fe", color: "#0369a1", label: "Published" },
  ongoing:    { bg: "#d1fae5", color: "#065f46", label: "Ongoing" },
  completed:  { bg: "#dcfce7", color: "#166534", label: "Completed" },
  closed:     { bg: "#fef2f2", color: "#991b1b", label: "Closed" },
  cancelled:  { bg: "#fef2f2", color: "#991b1b", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "0.25rem 0.75rem", borderRadius: "20px",
      fontSize: "0.78rem", fontWeight: "600",
    }}>
      {s.label}
    </span>
  );
}

function btnStyle(bg) {
  return {
    background: bg, color: "white", border: "none",
    padding: "0.35rem 0.75rem", borderRadius: "8px",
    cursor: "pointer", fontSize: "0.82rem", fontWeight: "600",
    transition: "all 0.15s",
  };
}

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/my-events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
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
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, status: data.status } : e));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Delete this event and all its registrations?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEvents(prev => prev.filter(e => e._id !== eventId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (eventId) => {
    if (!window.confirm("Cancel this event? This cannot be undone.")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, status: "cancelled" } : e));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading...</h2>;

  const completedEvents = events.filter(e => e.status === "completed" || e.status === "closed");
  const ongoingEvents   = events.filter(e => e.status === "ongoing");
  const totalRevenue    = events.reduce((s, e) => s + (e.revenue || 0), 0);
  const totalRegistrations = events.reduce((s, e) => s + (e.registrationCount || 0), 0);
  const totalAttended   = completedEvents.reduce((s, e) => s + (e.attendedCount || 0), 0);
  const completedReg    = completedEvents.reduce((s, e) => s + (e.registrationCount || 0), 0);
  const attendanceRate  = completedReg > 0 ? Math.round((totalAttended / completedReg) * 100) : 0;

  const filterOptions = ["all", "draft", "published", "ongoing", "completed", "closed", "cancelled"];
  const filteredEvents = activeFilter === "all" ? events : events.filter(e => e.status === activeFilter);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>Organizer Dashboard</h1>
        <button
          onClick={() => navigate("/organizer/create")}
          style={{ background: "linear-gradient(135deg, #10b981, #34d399)", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}
        >
          + Create Event
        </button>
      </div>

      {error && <p style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Events",        value: events.length,        color: "#6366f1" },
          { label: "Total Registrations", value: totalRegistrations,   color: "#10b981" },
          { label: "Total Revenue",       value: `₹${totalRevenue}`,   color: "#f59e0b" },
          { label: "Ongoing Events",      value: ongoingEvents.length, color: "#06b6d4" },
          { label: "Total Attended",      value: totalAttended,        color: "#8b5cf6" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.2rem", textAlign: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.06)" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.3rem" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {completedEvents.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.5rem", marginBottom: "2rem", boxShadow: "0 4px 12px rgba(99,102,241,0.06)" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Completed Event Analytics</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Event", "Type", "Registrations", "Attended", "Revenue"].map(h => (
                    <th key={h} style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #e2e8f0", fontSize: "0.82rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedEvents.map(event => (
                  <tr key={event._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem" }}>
                      <Link to={`/organizer/events/${event._id}`} style={{ color: "#6366f1", textDecoration: "none", fontWeight: "600" }}>
                        {event.title}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem" }}>{event.eventType === "merchandise" ? "Merchandise" : "Normal"}</td>
                    <td style={{ padding: "0.75rem" }}>{event.registrationCount || 0}</td>
                    <td style={{ padding: "0.75rem" }}>{event.attendedCount || 0}</td>
                    <td style={{ padding: "0.75rem" }}>₹{event.revenue || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {filterOptions.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: "0.4rem 1rem",
              background: activeFilter === f ? "#6366f1" : "white",
              color: activeFilter === f ? "white" : "#475569",
              border: "1.5px solid",
              borderColor: activeFilter === f ? "#6366f1" : "#e2e8f0",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "0.85rem",
              textTransform: "capitalize",
              fontWeight: activeFilter === f ? "600" : "500",
              transition: "all 0.15s",
            }}
          >
            {f} ({f === "all" ? events.length : events.filter(e => e.status === f).length})
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#94a3b8" }}>No events in this category.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredEvents.map(event => (
            <div key={event._id} style={{
              background: "white", border: "1px solid #e2e8f0", borderRadius: "16px",
              padding: "1.5rem", boxShadow: "0 4px 12px rgba(99,102,241,0.06)",
              display: "flex", flexDirection: "column",
              transition: "box-shadow 0.2s, transform 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1e293b", flex: 1, marginRight: "0.5rem" }}>
                  {event.title}
                </h3>
                <StatusBadge status={event.status} />
              </div>

              <span style={{
                display: "inline-block", width: "fit-content",
                background: event.eventType === "merchandise" ? "#fefce8" : "#ecfeff",
                color: event.eventType === "merchandise" ? "#92400e" : "#0e7490",
                padding: "0.2rem 0.6rem", borderRadius: "8px", fontSize: "0.78rem",
                marginBottom: "0.75rem",
              }}>
                {event.eventType === "merchandise" ? "Merchandise" : "Normal"}
              </span>

              <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.9", flex: 1 }}>
                <div><strong>📅</strong> {new Date(event.date).toLocaleDateString()}{event.endDate && ` → ${new Date(event.endDate).toLocaleDateString()}`}</div>
                <div><strong>📍</strong> {event.location}</div>
                <div><strong>👥</strong> {event.registrationCount || 0} / {event.capacity} registered</div>
                <div><strong>💰</strong> {event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"} &nbsp;|&nbsp; Revenue: ₹{event.revenue || 0}</div>
                {event.registrationDeadline && (
                  <div><strong>⏰ Reg Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</div>
                )}
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                <Link
                  to={`/organizer/events/${event._id}`}
                  style={{ ...btnStyle("#6366f1"), textDecoration: "none", display: "inline-block" }}
                >
                  View Details
                </Link>

                {event.status === "draft" && (
                  <>
                    <button onClick={() => navigate(`/organizer/edit/${event._id}`)} style={btnStyle("#64748b")}>Edit</button>
                    <button onClick={() => handleStatusChange(event._id, "published")} style={btnStyle("#10b981")}>Publish</button>
                  </>
                )}
                {event.status === "published" && (
                  <>
                    <button onClick={() => navigate(`/organizer/edit/${event._id}`)} style={btnStyle("#64748b")}>Edit</button>
                    <button onClick={() => handleStatusChange(event._id, "ongoing")} style={btnStyle("#06b6d4")}>Mark Ongoing</button>
                    <button onClick={() => handleStatusChange(event._id, "closed")} style={btnStyle("#f59e0b")}>Close Reg</button>
                    <button onClick={() => handleStatusChange(event._id, "draft")} style={btnStyle("#94a3b8")}>Unpublish</button>
                  </>
                )}
                {event.status === "ongoing" && (
                  <>
                    <button onClick={() => handleStatusChange(event._id, "completed")} style={btnStyle("#10b981")}>Mark Completed</button>
                    <button onClick={() => handleStatusChange(event._id, "closed")} style={btnStyle("#f59e0b")}>Close</button>
                  </>
                )}

                {!["cancelled", "completed", "closed"].includes(event.status) && (
                  <button onClick={() => handleCancel(event._id)} style={btnStyle("#f59e0b")}>Cancel</button>
                )}
                <button onClick={() => handleDelete(event._id)} style={btnStyle("#ef4444")}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;
