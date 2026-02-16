import { useEffect, useState } from "react";

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/events");
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

  const handleRegister = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage("Registered successfully!");
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading events...</h2>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Browse Events</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {events.length === 0 ? (
        <p>No events available right now.</p>
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

              <button onClick={() => handleRegister(event._id)}>
                Register
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BrowseEvents;
