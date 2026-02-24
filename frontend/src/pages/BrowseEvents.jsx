import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function BrowseEvents() {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customFormResponses, setCustomFormResponses] = useState({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEligibility, setFilterEligibility] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        setAllEvents(data);
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    filterAndSearchEvents();
  }, [searchQuery, filterType, filterEligibility, filterStartDate, filterEndDate, showFollowedOnly, allEvents]);

  const filterAndSearchEvents = () => {
    let filtered = [...allEvents];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        (event.createdBy?.email && event.createdBy.email.toLowerCase().includes(query)) ||
        (event.createdBy?.organizerName && event.createdBy.organizerName.toLowerCase().includes(query))
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(event => event.eventType === filterType);
    }

    if (filterEligibility !== "all") {
      filtered = filtered.filter(event => 
        event.eligibility && event.eligibility.toLowerCase().includes(filterEligibility.toLowerCase())
      );
    }

    if (filterStartDate) {
      filtered = filtered.filter(event => 
        new Date(event.date) >= new Date(filterStartDate)
      );
    }

    if (filterEndDate) {
      filtered = filtered.filter(event => 
        new Date(event.date) <= new Date(filterEndDate)
      );
    }

    setEvents(filtered);
  };

  const openRegistrationModal = (event) => {
    setSelectedEvent(event);
    setCustomFormResponses({});
    setShowModal(true);
    setMessage("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setCustomFormResponses({});
  };

  const handleCustomFormChange = (fieldName, value) => {
    setCustomFormResponses({
      ...customFormResponses,
      [fieldName]: value,
    });
  };

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/${selectedEvent._id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ customFormResponses }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage("Registered successfully!");
      closeModal();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading events...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <h1>Browse Events</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && (
        <div style={{ 
          padding: "1rem", 
          background: "#d1fae5", 
          color: "#065f46", 
          borderRadius: "10px", 
          marginBottom: "1rem",
          fontWeight: "500"
        }}>
          {message}
        </div>
      )}

      <div style={{ 
        background: "white", 
        padding: "1.5rem", 
        borderRadius: "16px", 
        marginBottom: "2rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 12px rgba(99,102,241,0.06)"
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="🔍 Search events or organizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              fontSize: "0.95rem",
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px",
              outline: "none",
              background: "#f8fafc",
              transition: "all 0.2s"
            }}
          />
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1rem",
          marginBottom: "1rem"
        }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.85rem", color: "#475569" }}>
              Event Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1.5px solid #e2e8f0" }}
            >
              <option value="all">All Types</option>
              <option value="normal">Normal Events</option>
              <option value="merchandise">Merchandise</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.85rem", color: "#475569" }}>
              Eligibility
            </label>
            <select
              value={filterEligibility}
              onChange={(e) => setFilterEligibility(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1.5px solid #e2e8f0" }}
            >
              <option value="all">All</option>
              <option value="iiit">IIIT Only</option>
              <option value="all participants">All Participants</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.85rem", color: "#475569" }}>
              From Date
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1.5px solid #e2e8f0" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.85rem", color: "#475569" }}>
              To Date
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1.5px solid #e2e8f0" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterType("all");
              setFilterEligibility("all");
              setFilterStartDate("");
              setFilterEndDate("");
            }}
            style={{
              padding: "0.5rem 1rem",
              background: "#64748b",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "500"
            }}
          >
            Clear Filters
          </button>
        </div>

        <p style={{ marginTop: "1rem", color: "#94a3b8", fontSize: "0.9rem" }}>
          Showing {events.length} event{events.length !== 1 ? "s" : ""}
        </p>
      </div>

      {events.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "3rem", 
          background: "white", 
          borderRadius: "16px",
          border: "1px solid #e2e8f0"
        }}>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
            No events found matching your criteria
          </p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {events.map((event) => {
            const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();
            const isCapacityFull = event.registeredCount >= event.capacity;
            const isIneligible = event.eligibility && (
              (event.eligibility.toLowerCase().includes("iiit") && !event.eligibility.toLowerCase().includes("non") && user?.userType !== "iiit-participant") ||
              (event.eligibility.toLowerCase().includes("non-iiit") && user?.userType !== "non-iiit-participant")
            );
            const canRegister = !isDeadlinePassed && !isCapacityFull && !isIneligible;

            return (
              <div
                key={event._id}
                style={{
                  padding: "1.5rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s, transform 0.2s"
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <Link 
                    to={`/events/${event._id}`}
                    style={{ 
                      textDecoration: "none", 
                      color: "#6366f1",
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      letterSpacing: "-0.01em"
                    }}
                  >
                    {event.title}
                  </Link>
                </div>

                <span style={{ 
                  display: "inline-block",
                  padding: "0.25rem 0.75rem", 
                  background: event.eventType === "normal" ? "#10b981" : "#f59e0b",
                  color: "white",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  width: "fit-content"
                }}>
                  {event.eventType === "normal" ? "Normal Event" : "Merchandise"}
                </span>

                <p style={{ color: "#64748b", fontSize: "0.93rem", marginBottom: "1rem", flexGrow: 1, lineHeight: "1.6" }}>
                  {event.description.length > 150 
                    ? event.description.substring(0, 150) + "..." 
                    : event.description}
                </p>

                <div style={{ fontSize: "0.9rem", lineHeight: "1.8", marginBottom: "1rem" }}>
                  <p><strong>📅</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>📍</strong> {event.location}</p>
                  <p><strong>✓</strong> {event.eligibility || "All participants"}</p>
                  <p><strong>💰</strong> ₹{event.registrationFee || 0}</p>
                  <p><strong>🎟️</strong> {event.registeredCount || 0} / {event.capacity} registered</p>
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    {event.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ 
                        display: "inline-block", 
                        background: "#e2e8f0", 
                        padding: "0.2rem 0.5rem", 
                        borderRadius: "3px", 
                        marginRight: "0.4rem",
                        fontSize: "0.75rem"
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {!canRegister && (
                  <p style={{ 
                    color: "#ef4444", 
                    fontWeight: "600", 
                    fontSize: "0.88rem",
                    marginBottom: "0.5rem"
                  }}>
                    {isDeadlinePassed ? "⏰ Registration closed" : isCapacityFull ? "👥 Event full" : isIneligible ? "🚫 Not eligible for this event" : ""}
                  </p>
                )}

                <button 
                  onClick={() => canRegister && openRegistrationModal(event)}
                  disabled={!canRegister}
                  style={{
                    width: "100%",
                    padding: "0.7rem",
                    background: canRegister ? "linear-gradient(135deg, #6366f1, #818cf8)" : "#e2e8f0",
                    color: canRegister ? "white" : "#94a3b8",
                    border: "none",
                    borderRadius: "10px",
                    cursor: canRegister ? "pointer" : "not-allowed",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    boxShadow: canRegister ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
                    transition: "all 0.15s"
                  }}
                >
                  {canRegister ? "Register Now" : "Registration Unavailable"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedEvent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "20px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}>
            <h2>Register for {selectedEvent.title}</h2>
            
            {selectedEvent.eventType === "normal" && selectedEvent.customForm && selectedEvent.customForm.length > 0 ? (
              <div>
                <p style={{ marginBottom: "1rem", color: "#64748b" }}>
                  Please fill in the following information:
                </p>
                
                {selectedEvent.customForm.map((field, index) => (
                  <div key={index} style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>
                      {field.fieldLabel}
                      {field.required && <span style={{ color: "red" }}> *</span>}
                    </label>
                    
                    {field.fieldType === "text" && (
                      <input
                        type="text"
                        value={customFormResponses[field.fieldName] || ""}
                        onChange={(e) => handleCustomFormChange(field.fieldName, e.target.value)}
                        required={field.required}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    )}
                    
                    {field.fieldType === "email" && (
                      <input
                        type="email"
                        value={customFormResponses[field.fieldName] || ""}
                        onChange={(e) => handleCustomFormChange(field.fieldName, e.target.value)}
                        required={field.required}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    )}
                    
                    {field.fieldType === "number" && (
                      <input
                        type="number"
                        value={customFormResponses[field.fieldName] || ""}
                        onChange={(e) => handleCustomFormChange(field.fieldName, e.target.value)}
                        required={field.required}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    )}
                    
                    {field.fieldType === "textarea" && (
                      <textarea
                        value={customFormResponses[field.fieldName] || ""}
                        onChange={(e) => handleCustomFormChange(field.fieldName, e.target.value)}
                        required={field.required}
                        rows="4"
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    )}
                    
                    {field.fieldType === "select" && (
                      <select
                        value={customFormResponses[field.fieldName] || ""}
                        onChange={(e) => handleCustomFormChange(field.fieldName, e.target.value)}
                        required={field.required}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                      >
                        <option value="">-- Select --</option>
                        {field.options && field.options.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    
                    {field.fieldType === "radio" && (
                      <div>
                        {field.options && field.options.map((option, i) => (
                          <label key={i} style={{ display: "block", marginBottom: "0.3rem" }}>
                            <input
                              type="radio"
                              name={field.fieldName}
                              value={option}
                              checked={customFormResponses[field.fieldName] === option}
                              onChange={(e) => handleCustomFormChange(field.fieldName, e.target.value)}
                              required={field.required}
                            />
                            {" "}{option}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {field.fieldType === "checkbox" && (
                      <label>
                        <input
                          type="checkbox"
                          checked={customFormResponses[field.fieldName] === true || customFormResponses[field.fieldName] === "true"}
                          onChange={(e) => handleCustomFormChange(field.fieldName, e.target.checked)}
                          required={field.required}
                        />
                        {" "}I agree
                      </label>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>Ready to register for this event?</p>
            )}

            {message && <p style={{ color: "red", marginTop: "1rem" }}>{message}</p>}
            
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
              <button
                onClick={handleRegister}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #10b981, #34d399)",
                  color: "white",
                  padding: "0.75rem",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Confirm Registration
              </button>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  background: "white",
                  color: "#64748b",
                  padding: "0.75rem",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "600",
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

export default BrowseEvents;
