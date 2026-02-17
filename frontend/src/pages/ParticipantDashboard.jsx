import { useEffect, useState } from "react";

function ParticipantDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:5000/api/registrations/my-events",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  // 👇 MOVE FUNCTION HERE (inside component)
  const handleUnregister = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/registrations/${eventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEvents((prevEvents) =>
        prevEvents.filter((event) => event._id !== eventId)
      );

    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>My Registered Events</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {events.length === 0 ? (
        <p>You have not registered for any events yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map((event) => (
            <li
              key={event._id}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p>
                <strong>Type:</strong>{" "}
                {event.eventType === "normal" 
                  ? "Normal Event" 
                  : "Merchandise Event"}
              </p>
              <p>
                <strong>Start Date:</strong>{" "}
                {new Date(event.date).toLocaleDateString()}
              </p>
              {event.endDate && (
                <p>
                  <strong>End Date:</strong>{" "}
                  {new Date(event.endDate).toLocaleDateString()}
                </p>
              )}
              <p>
                <strong>Location:</strong> {event.location}
              </p>
              {event.registrationFee > 0 && (
                <p>
                  <strong>Fee Paid:</strong> ₹{event.registrationFee}
                </p>
              )}
              {event.tags && event.tags.length > 0 && (
                <p>
                  <strong>Tags:</strong>{" "}
                  {event.tags.map(tag => (
                    <span key={tag} style={{ 
                      display: "inline-block", 
                      background: "#e0e0e0", 
                      padding: "0.2rem 0.4rem", 
                      borderRadius: "3px", 
                      marginRight: "0.3rem",
                      fontSize: "0.85rem"
                    }}>
                      {tag}
                    </span>
                  ))}
                </p>
              )}

              <button
                style={{
                  marginTop: "0.5rem",
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                onClick={() => handleUnregister(event._id)}
              >
                Unregister
              </button>
              <p><strong>Ticket ID:</strong> {event.ticketId}</p>
                <img
                  src={event.qrCode}
                  alt="QR Code"
                  style={{ width: "120px", marginTop: "0.5rem" }}
                />

                <p>
                  Status: {event.attended ? "Attended" : "Not Attended"}
                </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ParticipantDashboard;
