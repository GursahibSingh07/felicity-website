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
                <strong>Date:</strong>{" "}
                {new Date(event.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Location:</strong> {event.location}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ParticipantDashboard;
