import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState({});


  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:5000/api/events/my-events",
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

  const handleDelete = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEvents((prev) =>
        prev.filter((event) => event._id !== eventId)
      );

    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewAttendees = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/attendees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAttendees((prev) => ({
        ...prev,
        [eventId]: data,
      }));

    } catch (err) {
      alert(err.message);
    }
  };


  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>My Events</h1>

      <button
        style={{
          marginBottom: "1rem",
          background: "#4CAF50",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "5px",
        }}
        onClick={() => navigate("/organizer/create")}
      >
        + Create Event
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {events.length === 0 ? (
        <p>You have not created any events yet.</p>
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

              <p>Status: {event.status}</p>
              <p>Capacity: {event.capacity}</p>

              <p>
                Registrations:{" "}
                {event.registrationCount}
              </p>

              <button
                style={{ marginRight: "0.5rem" }}
                onClick={async () => {
                  const token = localStorage.getItem("token");

                  const res = await fetch(
                    `http://localhost:5000/api/events/${event._id}/status`,
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  const updated = await res.json();

                  setEvents((prev) =>
                    prev.map((e) =>
                      e._id === event._id
                        ? { ...e, status: updated.status }
                        : e
                    )
                  );
                }}
              >
                {event.status === "draft" ? "Publish" : "Unpublish"}
              </button>

              <button
                style={{ marginRight: "0.5rem" }}
                onClick={() => navigate(`/organizer/edit/${event._id}`)}
              >
                Edit
              </button>


              <button
                style={{ marginRight: "0.5rem" }}
                onClick={() => handleViewAttendees(event._id)}
              >
                View Attendees
              </button>

              <button
                style={{ background: "red", color: "white" }}
                onClick={() => handleDelete(event._id)}
              >
                Delete
              </button>

              {attendees[event._id] && (
                <div style={{ marginTop: "1rem", paddingLeft: "1rem" }}>
                  <h4>Attendees:</h4>
                  {attendees[event._id].length === 0 ? (
                    <p>No registrations yet.</p>
                  ) : (
                    <ul>
                      {attendees[event._id].map((attendee) => (
                        <li key={attendee._id} style={{ marginBottom: "0.5rem" }}>
                          {attendee.email}

                          <button
                            style={{
                              marginLeft: "0.5rem",
                              background: attendee.attended ? "gray" : "green",
                              color: "white",
                            }}
                            disabled={attendee.attended}
                            onClick={async () => {
                              const token = localStorage.getItem("token");

                              await fetch(
                                `http://localhost:5000/api/registrations/attend/${attendee.ticketId}`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );
                              handleViewAttendees(event._id);
                            }}
                          >
                            {attendee.attended ? "Attended" : "Mark Attended"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>

          ))}
        </ul>
      )}
    </div>
  );
}

export default OrganizerDashboard;
