import { useEffect, useState } from "react";

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customFormResponses, setCustomFormResponses] = useState({});

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
        `http://localhost:5000/api/events/${selectedEvent._id}/register`,
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
              <p>
                <strong>Eligibility:</strong> {event.eligibility || "All participants"}
              </p>
              <p>
                <strong>Registration Fee:</strong> ₹{event.registrationFee || 0}
              </p>
              <p>
                <strong>Registration Deadline:</strong>{" "}
                {new Date(event.registrationDeadline).toLocaleDateString()}
              </p>
              {event.tags && event.tags.length > 0 && (
                <p>
                  <strong>Tags:</strong>{" "}
                  {event.tags.map(tag => (
                    <span key={tag} style={{ 
                      display: "inline-block", 
                      background: "#e0e0e0", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "4px", 
                      marginRight: "0.3rem",
                      fontSize: "0.85rem"
                    }}>
                      {tag}
                    </span>
                  ))}
                </p>
              )}
              {event.eventType === "merchandise" && event.merchandiseDetails && (
                <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "#f9f9f9", borderRadius: "4px" }}>
                  <strong>Merchandise Details:</strong>
                  {event.merchandiseDetails.sizes?.length > 0 && (
                    <p>Sizes: {event.merchandiseDetails.sizes.join(", ")}</p>
                  )}
                  {event.merchandiseDetails.colors?.length > 0 && (
                    <p>Colors: {event.merchandiseDetails.colors.join(", ")}</p>
                  )}
                  {event.merchandiseDetails.variants?.length > 0 && (
                    <p>Variants: {event.merchandiseDetails.variants.join(", ")}</p>
                  )}
                  <p>Stock: {event.merchandiseDetails.stockQuantity || 0}</p>
                  <p>Max per person: {event.merchandiseDetails.purchaseLimitPerParticipant || 1}</p>
                </div>
              )}

              <button onClick={() => openRegistrationModal(event)}>
                Register
              </button>
            </li>
          ))}
        </ul>
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
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}>
            <h2>Register for {selectedEvent.title}</h2>
            
            {selectedEvent.eventType === "normal" && selectedEvent.customForm && selectedEvent.customForm.length > 0 ? (
              <div>
                <p style={{ marginBottom: "1rem", color: "#666" }}>
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
                  background: "#4CAF50",
                  color: "white",
                  padding: "0.75rem",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                Confirm Registration
              </button>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  background: "#f44336",
                  color: "white",
                  padding: "0.75rem",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  cursor: "pointer",
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
