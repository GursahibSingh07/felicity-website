import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const STATUS_COLORS = {
  draft:      { bg: "#e9ecef", color: "#495057", label: "Draft" },
  published:  { bg: "#cff4fc", color: "#0c5460", label: "Published" },
  ongoing:    { bg: "#d1e7dd", color: "#0f5132", label: "Ongoing" },
  completed:  { bg: "#d4edda", color: "#155724", label: "Completed" },
  closed:     { bg: "#f8d7da", color: "#721c24", label: "Closed" },
  cancelled:  { bg: "#f8d7da", color: "#721c24", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "0.25rem 0.75rem", borderRadius: "12px",
      fontSize: "0.8rem", fontWeight: "bold",
    }}>
      {s.label}
    </span>
  );
}

function btnStyle(bg) {
  return {
    background: bg, color: "white", border: "none",
    padding: "0.35rem 0.75rem", borderRadius: "5px",
    cursor: "pointer", fontSize: "0.82rem", fontWeight: "bold",
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
        const res = await fetch("http://localhost:5000/api/events/my-events", {
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
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/status`, {
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
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
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
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/cancel`, {
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

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;

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
          style={{ background: "#28a745", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
        >
          + Create Event
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Events",        value: events.length,        color: "#007bff" },
          { label: "Total Registrations", value: totalRegistrations,   color: "#28a745" },
          { label: "Total Revenue",       value: `₹${totalRevenue}`,   color: "#fd7e14" },
          { label: "Ongoing Events",      value: ongoingEvents.length, color: "#17a2b8" },
          { label: "Attendance Rate",     value: `${attendanceRate}%`, color: "#6f42c1" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "1.2rem", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.3rem" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {completedEvents.length > 0 && (
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Completed Event Analytics</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["Event", "Type", "Registrations", "Attended", "Revenue", "Attendance Rate"].map(h => (
                    <th key={h} style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #ddd" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedEvents.map(event => (
                  <tr key={event._id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "0.75rem" }}>
                      <Link to={`/organizer/events/${event._id}`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>
                        {event.title}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem" }}>{event.eventType === "merchandise" ? "Merchandise" : "Normal"}</td>
                    <td style={{ padding: "0.75rem" }}>{event.registrationCount || 0}</td>
                    <td style={{ padding: "0.75rem" }}>{event.attendedCount || 0}</td>
                    <td style={{ padding: "0.75rem" }}>₹{event.revenue || 0}</td>
                    <td style={{ padding: "0.75rem" }}>
                      {event.registrationCount > 0
                        ? `${Math.round(((event.attendedCount || 0) / event.registrationCount) * 100)}%`
                        : "—"
                      }
                    </td>
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
              background: activeFilter === f ? "#007bff" : "white",
              color: activeFilter === f ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "0.85rem",
              textTransform: "capitalize",
              fontWeight: activeFilter === f ? "bold" : "normal",
            }}
          >
            {f} ({f === "all" ? events.length : events.filter(e => e.status === f).length})
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#f9f9f9", borderRadius: "8px" }}>
          <p style={{ color: "#666" }}>No events in this category.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredEvents.map(event => (
            <div key={event._id} style={{
              background: "white", border: "1px solid #ddd", borderRadius: "10px",
              padding: "1.5rem", boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#333", flex: 1, marginRight: "0.5rem" }}>
                  {event.title}
                </h3>
                <StatusBadge status={event.status} />
              </div>

              <span style={{
                display: "inline-block", width: "fit-content",
                background: event.eventType === "merchandise" ? "#fff3cd" : "#d1ecf1",
                color: event.eventType === "merchandise" ? "#856404" : "#0c5460",
                padding: "0.2rem 0.6rem", borderRadius: "8px", fontSize: "0.78rem",
                marginBottom: "0.75rem",
              }}>
                {event.eventType === "merchandise" ? "Merchandise" : "Normal"}
              </span>

              <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: "1.9", flex: 1 }}>
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
                  style={{ ...btnStyle("#007bff"), textDecoration: "none", display: "inline-block" }}
                >
                  View Details
                </Link>

                {event.status === "draft" && (
                  <>
                    <button onClick={() => navigate(`/organizer/edit/${event._id}`)} style={btnStyle("#6c757d")}>Edit</button>
                    <button onClick={() => handleStatusChange(event._id, "published")} style={btnStyle("#28a745")}>Publish</button>
                  </>
                )}
                {event.status === "published" && (
                  <>
                    <button onClick={() => navigate(`/organizer/edit/${event._id}`)} style={btnStyle("#6c757d")}>Edit</button>
                    <button onClick={() => handleStatusChange(event._id, "ongoing")} style={btnStyle("#17a2b8")}>Mark Ongoing</button>
                    <button onClick={() => handleStatusChange(event._id, "closed")} style={btnStyle("#fd7e14")}>Close Reg</button>
                    <button onClick={() => handleStatusChange(event._id, "draft")} style={btnStyle("#adb5bd")}>Unpublish</button>
                  </>
                )}
                {event.status === "ongoing" && (
                  <>
                    <button onClick={() => handleStatusChange(event._id, "completed")} style={btnStyle("#28a745")}>Mark Completed</button>
                    <button onClick={() => handleStatusChange(event._id, "closed")} style={btnStyle("#fd7e14")}>Close</button>
                  </>
                )}

                {!["cancelled", "completed", "closed"].includes(event.status) && (
                  <button onClick={() => handleCancel(event._id)} style={btnStyle("#ff9800")}>Cancel</button>
                )}
                <button onClick={() => handleDelete(event._id)} style={btnStyle("#dc3545")}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;
