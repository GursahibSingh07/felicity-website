import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ParticipantDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [existingFeedbacks, setExistingFeedbacks] = useState({});

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/registrations/my-events`,
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

  const handleUnregister = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/registrations/${eventId}`,
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

  const openFeedbackModal = async (event) => {
    setFeedbackModal(event);
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/${event._id}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFeedbackRating(data.rating);
          setFeedbackComment(data.comment || "");
          setExistingFeedbacks(prev => ({ ...prev, [event._id]: data }));
        }
      }
    } catch {}
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      setFeedbackMessage("Please select a rating");
      return;
    }
    setFeedbackSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/${feedbackModal._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFeedbackMessage(data.message);
      setExistingFeedbacks(prev => ({ ...prev, [feedbackModal._id]: { rating: feedbackRating, comment: feedbackComment } }));
      setTimeout(() => setFeedbackModal(null), 1500);
    } catch (err) {
      setFeedbackMessage(err.message);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const renderStars = (rating, hover, interactive = false) => {
    return [1, 2, 3, 4, 5].map(star => (
      <span
        key={star}
        onClick={interactive ? () => setFeedbackRating(star) : undefined}
        onMouseEnter={interactive ? () => setFeedbackHover(star) : undefined}
        onMouseLeave={interactive ? () => setFeedbackHover(0) : undefined}
        style={{
          fontSize: interactive ? "2rem" : "1rem",
          cursor: interactive ? "pointer" : "default",
          color: star <= (hover || rating) ? "#f59e0b" : "#e2e8f0",
          transition: "color 0.15s",
        }}
      >
        ★
      </span>
    ));
  };
  
  const now = new Date();

  const cancelledEvents = events.filter(event => {
    const s = event.eventStatus || event.status;
    return s === "cancelled" || s === "draft";
  });
  
  const nonCancelledEvents = events.filter(event => {
    const s = event.eventStatus || event.status;
    return s !== "cancelled" && s !== "draft";
  });
  
  const completedEvents = nonCancelledEvents.filter(event => {
    const s = event.eventStatus || event.status;
    return s === "completed" || s === "closed" || new Date(event.endDate || event.date) < now;
  });
  const ongoingEvents = nonCancelledEvents.filter(event => {
    const s = event.eventStatus || event.status;
    const start = new Date(event.date);
    const end = new Date(event.endDate || event.date);
    return s === "ongoing" || (start <= now && now <= end && s !== "completed" && s !== "closed");
  });
  const upcomingEvents = nonCancelledEvents.filter(event => {
    const s = event.eventStatus || event.status;
    return s !== "completed" && s !== "closed" && s !== "ongoing" && new Date(event.date) > now;
  });
  const normalEvents = nonCancelledEvents.filter(event => event.eventType === "normal");
  const merchandiseEvents = nonCancelledEvents.filter(event => event.eventType === "merchandise");

  const getFilteredEvents = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingEvents;
      case "ongoing":
        return ongoingEvents;
      case "normal":
        return normalEvents;
      case "merchandise":
        return merchandiseEvents;
      case "completed":
        return completedEvents;
      case "cancelled":
        return cancelledEvents;
      default:
        return events;
    }
  };

  const filteredEvents = getFilteredEvents();

  if (loading) return <h2 style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>My Events Dashboard</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Manage your event registrations and view participation history
      </p>

      {error && <p style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem" }}>{error}</p>}

      <div style={{ marginBottom: "2rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", background: "#f1f5f9", padding: "0.35rem", borderRadius: "12px" }}>
        {["upcoming", "ongoing", "normal", "merchandise", "completed", "cancelled"].map((tab) => (
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
            {tab} ({
              tab === "upcoming" ? upcomingEvents.length :
              tab === "ongoing" ? ongoingEvents.length :
              tab === "normal" ? normalEvents.length :
              tab === "merchandise" ? merchandiseEvents.length :
              tab === "completed" ? completedEvents.length :
              cancelledEvents.length
            })
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
            No events found in this category
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              style={{
                padding: "1.5rem",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                background: "white",
                boxShadow: "0 4px 12px rgba(99,102,241,0.06)",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#1e293b" }}>{event.title}</h3>
              
              <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ 
                  display: "inline-block",
                  padding: "0.25rem 0.75rem", 
                  background: event.eventType === "normal" ? "#10b981" : "#f59e0b",
                  color: "white",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "600"
                }}>
                  {event.eventType === "normal" ? "Normal Event" : "Merchandise"}
                </span>
                {(event.status === "cancelled" || event.eventStatus === "cancelled") && (
                  <span style={{ 
                    display: "inline-block",
                    padding: "0.25rem 0.75rem", 
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}>
                    Cancelled
                  </span>
                )}
                {(event.status === "draft" || event.eventStatus === "draft") && 
                 event.status !== "cancelled" && event.eventStatus !== "cancelled" && (
                  <span style={{ 
                    display: "inline-block",
                    padding: "0.25rem 0.75rem", 
                    background: "#94a3b8",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}>
                    Unpublished
                  </span>
                )}
                {event.paymentStatus && event.paymentStatus !== "none" && (
                  <span style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    background: event.paymentStatus === "approved" ? "#ecfdf5" : event.paymentStatus === "pending" ? "#fefce8" : "#fef2f2",
                    color: event.paymentStatus === "approved" ? "#065f46" : event.paymentStatus === "pending" ? "#92400e" : "#ef4444",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                  }}>
                    Payment: {event.paymentStatus.charAt(0).toUpperCase() + event.paymentStatus.slice(1)}
                  </span>
                )}
              </div>

              <p style={{ color: "#64748b", fontSize: "0.93rem", marginBottom: "1rem", lineHeight: "1.6" }}>
                {event.description}
              </p>

              <div style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
                <p><strong>📅 Start:</strong> {new Date(event.date).toLocaleDateString()}</p>
                {event.endDate && (
                  <p><strong>📅 End:</strong> {new Date(event.endDate).toLocaleDateString()}</p>
                )}
                <p><strong>📍 Location:</strong> {event.location}</p>
                {event.registrationFee > 0 && (
                  <p><strong>💰 Fee Paid:</strong> ₹{event.registrationFee}</p>
                )}
                <p><strong>🎫 Ticket ID:</strong> 
                  <span style={{ 
                    background: "#eef2ff", 
                    padding: "0.2rem 0.5rem", 
                    borderRadius: "4px",
                    marginLeft: "0.5rem",
                    fontFamily: "monospace",
                    cursor: "pointer"
                  }} title="Click to copy">
                    {event.ticketId}
                  </span>
                </p>
                {event.attended !== undefined && (
                  <p><strong>✓ Attended:</strong> {event.attended ? "Yes" : "No"}</p>
                )}
              </div>

              {event.tags && event.tags.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  {event.tags.map(tag => (
                    <span key={tag} style={{ 
                      display: "inline-block", 
                      background: "#e2e8f0", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "3px", 
                      marginRight: "0.4rem",
                      marginBottom: "0.4rem",
                      fontSize: "0.8rem"
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {event.paymentStatus === "rejected" && event.rejectionReason && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef2f2", borderRadius: "10px", fontSize: "0.9rem", color: "#ef4444" }}>
                  <strong>Rejection Reason:</strong> {event.rejectionReason}
                </div>
              )}

              {event.paymentStatus === "pending" && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fefce8", borderRadius: "10px", fontSize: "0.9rem", color: "#92400e" }}>
                  Payment is pending approval. QR code will be available once approved.
                </div>
              )}

              {event.qrCode && (
                <div style={{ textAlign: "center", marginTop: "1rem", padding: "1rem", background: "#f8fafc", borderRadius: "12px" }}>
                  <img
                    src={event.qrCode}
                    alt="QR Code"
                    style={{ width: "120px", height: "120px" }}
                  />
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                    Show this QR at the event
                  </p>
                </div>
              )}

              <Link
                to={`/events/${event._id}`}
                style={{
                  display: "block",
                  marginTop: "1rem",
                  width: "100%",
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  color: "white",
                  border: "none",
                  padding: "0.7rem",
                  borderRadius: "10px",
                  textAlign: "center",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              >
                View Details
              </Link>

              {activeTab === "upcoming" && (
                <button
                  style={{
                    marginTop: "0.5rem",
                    width: "100%",
                    background: "linear-gradient(135deg, #ef4444, #f87171)",
                    color: "white",
                    border: "none",
                    padding: "0.7rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}
                  onClick={() => handleUnregister(event._id)}
                >
                  Unregister
                </button>
              )}

              {event.attended && (
                <button
                  onClick={() => openFeedbackModal(event)}
                  style={{
                    marginTop: "0.75rem",
                    width: "100%",
                    background: existingFeedbacks[event._id] ? "#64748b" : "linear-gradient(135deg, #f59e0b, #fbbf24)",
                    color: existingFeedbacks[event._id] ? "white" : "#1e293b",
                    border: "none",
                    padding: "0.7rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {existingFeedbacks[event._id] ? "✓ Edit Feedback" : "⭐ Rate this Event"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {feedbackModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "white", borderRadius: "20px", padding: "2rem",
            maxWidth: "450px", width: "90%", textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "0.25rem" }}>Rate your experience</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>{feedbackModal.title}</p>

            <div style={{ marginBottom: "1.5rem" }}>
              {renderStars(feedbackRating, feedbackHover, true)}
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                {feedbackRating === 1 ? "Terrible" : feedbackRating === 2 ? "Poor" : feedbackRating === 3 ? "Average" : feedbackRating === 4 ? "Good" : feedbackRating === 5 ? "Excellent" : "Tap a star to rate"}
              </p>
            </div>

            <textarea
              value={feedbackComment}
              onChange={e => setFeedbackComment(e.target.value)}
              placeholder="Describe your experience (optional)"
              rows="4"
              maxLength={1000}
              style={{
                width: "100%", padding: "0.75rem", border: "1px solid #e2e8f0",
                borderRadius: "8px", resize: "vertical", fontSize: "0.95rem",
                boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
            <p style={{ fontSize: "0.75rem", color: "#cbd5e1", textAlign: "right", margin: "0.25rem 0 1rem 0" }}>
              {feedbackComment.length}/1000
            </p>

            <div style={{ padding: "0.5rem", background: "#eef2ff", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.8rem", color: "#64748b" }}>
              🔒 Your feedback is anonymous — organizers cannot see your identity.
            </div>

            {feedbackMessage && (
              <p style={{
                color: feedbackMessage.includes("submitted") || feedbackMessage.includes("updated") ? "#10b981" : "#ef4444",
                fontSize: "0.9rem", marginBottom: "0.75rem",
              }}>{feedbackMessage}</p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleSubmitFeedback}
                disabled={feedbackSubmitting || feedbackRating === 0}
                style={{
                  flex: 1, padding: "0.75rem", border: "none", borderRadius: "10px",
                  background: feedbackRating > 0 ? "linear-gradient(135deg, #10b981, #34d399)" : "#e2e8f0",
                  color: "white", fontWeight: "bold", fontSize: "1rem",
                  cursor: feedbackRating > 0 ? "pointer" : "not-allowed",
                }}
              >
                {feedbackSubmitting ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={() => setFeedbackModal(null)}
                style={{
                  flex: 1, padding: "0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "10px",
                  background: "white", color: "#64748b", fontWeight: "600", fontSize: "1rem", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantDashboard;
