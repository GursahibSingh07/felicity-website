import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function OrganizerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    const fetchOrganizerDetails = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer/${id}`);
        const responseData = await res.json();

        if (!res.ok) throw new Error(responseData.message);

        setData(responseData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerDetails();
  }, [id]);

  if (loading) return <h2 style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading organizer details...</h2>;
  if (error) return <div style={{ padding: "2rem" }}><p style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem 1rem", borderRadius: "10px" }}>{error}</p></div>;
  if (!data) return <div style={{ padding: "2rem" }}><p>Organizer not found</p></div>;

  const { organizer, upcomingEvents, pastEvents } = data;
  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          background: "#f1f5f9",
          color: "#475569",
          border: "1.5px solid #e2e8f0",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "0.9rem"
        }}
      >
        ← Back
      </button>

      <div style={{
        padding: "2rem",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(99,102,241,0.06)"
      }}>
        <h1 style={{ marginTop: 0 }}>{organizer.organizerName || "Unnamed Organizer"}</h1>

        <span style={{
          display: "inline-block",
          padding: "0.4rem 1rem",
          background: "#ede9fe",
          color: "#7c3aed",
          borderRadius: "20px",
          fontSize: "0.85rem",
          fontWeight: "600",
          marginBottom: "1rem"
        }}>
          {organizer.category || "General"}
        </span>

        <p style={{ fontSize: "1.05rem", color: "#475569", lineHeight: "1.8", marginBottom: "1rem" }}>
          {organizer.description || "No description available"}
        </p>

        <div style={{
          padding: "1rem",
          background: "#f8fafc",
          borderRadius: "12px"
        }}>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>📧 Contact Email:</strong> {organizer.email}
          </p>
        </div>
      </div>

      <div>
        <h2>Events</h2>

        <div style={{ marginBottom: "2rem", display: "flex", gap: "0.4rem", background: "#f1f5f9", padding: "0.35rem", borderRadius: "12px" }}>
          {["upcoming", "past"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.6rem 1.25rem",
                background: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "#6366f1" : "#64748b",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: activeTab === tab ? "600" : "500",
                textTransform: "capitalize",
                boxShadow: activeTab === tab ? "0 2px 8px rgba(99,102,241,0.1)" : "none",
                transition: "all 0.15s"
              }}
            >
              {tab} ({tab === "upcoming" ? upcomingEvents.length : pastEvents.length})
            </button>
          ))}
        </div>

        {displayEvents.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e2e8f0"
          }}>
            <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
              No {activeTab} events
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem"
          }}>
            {displayEvents.map((event) => (
              <div
                key={event._id}
                style={{
                  padding: "1.5rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.06)",
                  transition: "box-shadow 0.2s"
                }}
              >
                <Link
                  to={`/events/${event._id}`}
                  style={{
                    textDecoration: "none",
                    color: "#6366f1",
                    fontSize: "1.15rem",
                    fontWeight: "700"
                  }}
                >
                  {event.title}
                </Link>

                <span style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  background: event.eventType === "normal" ? "#10b981" : "#f59e0b",
                  color: "white",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  marginTop: "0.75rem",
                  marginBottom: "1rem"
                }}>
                  {event.eventType === "normal" ? "Normal Event" : "Merchandise"}
                </span>

                <p style={{ color: "#64748b", fontSize: "0.93rem", marginBottom: "1rem", lineHeight: "1.6" }}>
                  {event.description?.length > 120
                    ? event.description.substring(0, 120) + "..."
                    : event.description}
                </p>

                <div style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
                  <p>
                    <strong>📅</strong> {new Date(event.date).toLocaleDateString()}
                    {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                  </p>
                  <p><strong>📍</strong> {event.location}</p>
                  {event.registrationFee > 0 && (
                    <p><strong>💰</strong> ₹{event.registrationFee}</p>
                  )}
                  {event.capacity && activeTab === "upcoming" && (
                    <p><strong>🎟️</strong> {event.registeredCount || 0} / {event.capacity}</p>
                  )}
                </div>

                {activeTab === "upcoming" && (
                  <Link
                    to={`/events/${event._id}`}
                    style={{
                      display: "block",
                      marginTop: "1rem",
                      padding: "0.7rem",
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      color: "white",
                      textAlign: "center",
                      textDecoration: "none",
                      borderRadius: "10px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      boxShadow: "0 4px 12px rgba(99,102,241,0.2)"
                    }}
                  >
                    View Details
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizerDetail;
