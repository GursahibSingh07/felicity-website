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

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading organizer details...</h2>;
  if (error) return <div style={{ padding: "2rem" }}><p style={{ color: "red" }}>{error}</p></div>;
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
          background: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        ← Back
      </button>

      <div style={{
        padding: "2rem",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        marginBottom: "2rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ marginTop: 0 }}>{organizer.organizerName || "Unnamed Organizer"}</h1>

        <span style={{
          display: "inline-block",
          padding: "0.4rem 1rem",
          background: "#e3f2fd",
          color: "#1976d2",
          borderRadius: "15px",
          fontSize: "0.9rem",
          fontWeight: "bold",
          marginBottom: "1rem"
        }}>
          {organizer.category || "General"}
        </span>

        <p style={{ fontSize: "1.1rem", color: "#333", lineHeight: "1.8", marginBottom: "1rem" }}>
          {organizer.description || "No description available"}
        </p>

        <div style={{
          padding: "1rem",
          background: "#f8f9fa",
          borderRadius: "8px"
        }}>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>📧 Contact Email:</strong> {organizer.email}
          </p>
        </div>
      </div>

      <div>
        <h2>Events</h2>

        <div style={{ marginBottom: "2rem", borderBottom: "2px solid #ddd" }}>
          {["upcoming", "past"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1.5rem",
                background: activeTab === tab ? "#007bff" : "transparent",
                color: activeTab === tab ? "white" : "#007bff",
                border: "none",
                borderBottom: activeTab === tab ? "3px solid #007bff" : "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: activeTab === tab ? "bold" : "normal",
                textTransform: "capitalize"
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
            background: "#f9f9f9",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>
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
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <Link
                  to={`/events/${event._id}`}
                  style={{
                    textDecoration: "none",
                    color: "#007bff",
                    fontSize: "1.2rem",
                    fontWeight: "bold"
                  }}
                >
                  {event.title}
                </Link>

                <span style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  background: event.eventType === "normal" ? "#28a745" : "#ff9800",
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  marginTop: "0.75rem",
                  marginBottom: "1rem"
                }}>
                  {event.eventType === "normal" ? "Normal Event" : "Merchandise"}
                </span>

                <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "1rem" }}>
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
                      padding: "0.75rem",
                      background: "#007bff",
                      color: "white",
                      textAlign: "center",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontWeight: "bold"
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
