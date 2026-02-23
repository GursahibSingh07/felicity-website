import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [customFormResponses, setCustomFormResponses] = useState({});
  const [paymentProof, setPaymentProof] = useState("");
  const [merchSize, setMerchSize] = useState("");
  const [merchColor, setMerchColor] = useState("");
  const [merchVariant, setMerchVariant] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [discussionError, setDiscussionError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "🤔", "👎"];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/events/public/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleCustomFormChange = (fieldName, value) => {
    setCustomFormResponses({
      ...customFormResponses,
      [fieldName]: value,
    });
  };

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem("token");

      const bodyData = { customFormResponses };

      if (event.eventType === "merchandise") {
        if (!paymentProof) {
          setMessage("Payment proof (image URL or transaction ID) is required");
          return;
        }
        bodyData.paymentProof = paymentProof;
        bodyData.merchandiseSelections = {
          size: merchSize,
          color: merchColor,
          variant: merchVariant,
          quantity: 1,
        };
      }

      const res = await fetch(
        `http://localhost:5000/api/events/${id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage(data.message || "Registered successfully! Redirecting to dashboard...");
      setShowModal(false);
      
      setTimeout(() => navigate("/participant/dashboard"), 2000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/discussions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setDiscussionError(data.message);
        return;
      }
      const data = await res.json();
      setMessages(data);
      setDiscussionError("");
    } catch (err) {
      setDiscussionError(err.message);
    }
  }, [id]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const lastVisit = localStorage.getItem(`discussion_last_visit_${id}`) || new Date(0).toISOString();
      const res = await fetch(`http://localhost:5000/api/discussions/${id}/unread?since=${lastVisit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    if (user && (user.role === "participant" || user.role === "organizer")) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (showDiscussion) {
      fetchMessages();
      localStorage.setItem(`discussion_last_visit_${id}`, new Date().toISOString());
      setUnreadCount(0);
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [showDiscussion, fetchMessages, id]);

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const body = { content: newMessage.trim() };
      if (replyTo) body.parentMessage = replyTo;
      if (isAnnouncement) body.isAnnouncement = true;

      const res = await fetch(`http://localhost:5000/api/discussions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setDiscussionError(data.message);
        return;
      }
      setNewMessage("");
      setReplyTo(null);
      setIsAnnouncement(false);
      fetchMessages();
    } catch (err) {
      setDiscussionError(err.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/discussions/message/${messageId}/delete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMessages();
    } catch {}
  };

  const handlePinMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/discussions/message/${messageId}/pin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMessages();
    } catch {}
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/discussions/message/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emoji }),
      });
      fetchMessages();
    } catch {}
  };

  const isEventOrganizer = user && user.role === "organizer" && event && event.organizer &&
    (event.organizer._id === user.userId || event.organizer === user.userId);

  const renderMessage = (msg, isReply = false) => (
    <div key={msg._id} style={{
      padding: "0.75rem",
      marginBottom: isReply ? "0.5rem" : "0.75rem",
      marginLeft: isReply ? "2rem" : 0,
      background: msg.isAnnouncement ? "#fff3cd" : msg.isPinned ? "#e8f4f8" : "#f8f9fa",
      borderRadius: "6px",
      borderLeft: msg.isAnnouncement ? "4px solid #ffc107" : msg.isPinned ? "4px solid #17a2b8" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
        <div>
          <strong style={{ fontSize: "0.9rem" }}>{msg.author?.email || "Unknown"}</strong>
          {msg.isAnnouncement && <span style={{ marginLeft: "0.5rem", background: "#ffc107", color: "#333", padding: "0.1rem 0.4rem", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "bold" }}>ANNOUNCEMENT</span>}
          {msg.isPinned && <span style={{ marginLeft: "0.5rem", color: "#17a2b8", fontSize: "0.75rem" }}>📌 Pinned</span>}
        </div>
        <span style={{ fontSize: "0.75rem", color: "#999" }}>{new Date(msg.createdAt).toLocaleString()}</span>
      </div>

      <p style={{ margin: "0.3rem 0", color: msg.isDeleted ? "#999" : "#333", fontStyle: msg.isDeleted ? "italic" : "normal" }}>{msg.content}</p>

      {!msg.isDeleted && (
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.4rem" }}>
          {EMOJI_OPTIONS.map(emoji => {
            const count = msg.reactions?.filter(r => r.emoji === emoji).length || 0;
            const userReacted = msg.reactions?.some(r => r.emoji === emoji && r.user === user?.userId);
            return (
              <button key={emoji} onClick={() => handleReact(msg._id, emoji)} style={{
                padding: "0.15rem 0.4rem", border: userReacted ? "2px solid #007bff" : "1px solid #ddd",
                borderRadius: "12px", background: userReacted ? "#e7f1ff" : "white", cursor: "pointer", fontSize: "0.8rem",
              }}>
                {emoji}{count > 0 && ` ${count}`}
              </button>
            );
          })}

          {!isReply && (
            <button onClick={() => setReplyTo(msg._id)} style={{
              padding: "0.15rem 0.5rem", border: "1px solid #ddd", borderRadius: "12px",
              background: "white", cursor: "pointer", fontSize: "0.75rem", color: "#666",
            }}>↩ Reply</button>
          )}

          {(user?.userId === msg.author?._id || isEventOrganizer) && (
            <button onClick={() => handleDeleteMessage(msg._id)} style={{
              padding: "0.15rem 0.5rem", border: "1px solid #dc3545", borderRadius: "12px",
              background: "white", cursor: "pointer", fontSize: "0.75rem", color: "#dc3545",
            }}>🗑</button>
          )}

          {isEventOrganizer && !isReply && (
            <button onClick={() => handlePinMessage(msg._id)} style={{
              padding: "0.15rem 0.5rem", border: "1px solid #17a2b8", borderRadius: "12px",
              background: "white", cursor: "pointer", fontSize: "0.75rem", color: "#17a2b8",
            }}>{msg.isPinned ? "Unpin" : "📌 Pin"}</button>
          )}
        </div>
      )}

      {msg.replies && msg.replies.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          {msg.replies.map(reply => renderMessage(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading event details...</h2>;
  if (error) return <div style={{ padding: "2rem" }}><p style={{ color: "red" }}>{error}</p></div>;
  if (!event) return <div style={{ padding: "2rem" }}><p>Event not found</p></div>;

  const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();
  const isCapacityFull = event.registeredCount >= event.capacity;
  const isStockExhausted = event.eventType === "merchandise" && event.merchandiseDetails?.stockQuantity <= 0;
  const canRegister = !isDeadlinePassed && !isCapacityFull && !isStockExhausted;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
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
        ← Back to Events
      </button>

      {message && (
        <div style={{ 
          padding: "1rem", 
          background: message.includes("success") ? "#d4edda" : "#f8d7da", 
          color: message.includes("success") ? "#155724" : "#721c24", 
          borderRadius: "4px", 
          marginBottom: "1rem" 
        }}>
          {message}
        </div>
      )}

      <div style={{ 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        padding: "2rem",
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ marginTop: 0 }}>{event.title}</h1>
        
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ 
            display: "inline-block",
            padding: "0.4rem 1rem", 
            background: event.eventType === "normal" ? "#28a745" : "#ff9800",
            color: "white",
            borderRadius: "15px",
            fontSize: "0.9rem",
            fontWeight: "bold"
          }}>
            {event.eventType === "normal" ? "Normal Event" : "Merchandise Event"}
          </span>
        </div>

        <div style={{ 
          padding: "1rem", 
          background: "#f8f9fa", 
          borderRadius: "8px",
          marginBottom: "1.5rem"
        }}>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>📅 Event Date:</strong> {new Date(event.date).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>📍 Location:</strong> {event.location}
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>✓ Eligibility:</strong> {event.eligibility || "All participants"}
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>💰 Registration Fee:</strong> ₹{event.registrationFee || 0}
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>🎟️ Capacity:</strong> {event.registeredCount || 0} / {event.capacity}
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "1rem" }}>
            <strong>⏰ Registration Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3>Description</h3>
          <p style={{ lineHeight: "1.8", color: "#333" }}>{event.description}</p>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h4>Tags</h4>
            <div>
              {event.tags.map(tag => (
                <span key={tag} style={{ 
                  display: "inline-block", 
                  background: "#e0e0e0", 
                  padding: "0.3rem 0.7rem", 
                  borderRadius: "15px", 
                  marginRight: "0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem"
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {event.eventType === "normal" && event.customForm && event.customForm.length > 0 && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#e3f2fd", borderRadius: "8px" }}>
            <h4>Additional Information Required</h4>
            <p style={{ color: "#666" }}>
              This event requires you to fill in {event.customForm.length} additional field(s) during registration.
            </p>
          </div>
        )}

        {event.eventType === "merchandise" && event.merchandiseDetails && (
          <div style={{ 
            padding: "1rem", 
            background: "#fff3cd", 
            borderRadius: "8px",
            marginBottom: "1.5rem"
          }}>
            <h3>Merchandise Details</h3>
            {event.merchandiseDetails.sizes?.length > 0 && (
              <p><strong>Available Sizes:</strong> {event.merchandiseDetails.sizes.join(", ")}</p>
            )}
            {event.merchandiseDetails.colors?.length > 0 && (
              <p><strong>Available Colors:</strong> {event.merchandiseDetails.colors.join(", ")}</p>
            )}
            {event.merchandiseDetails.variants?.length > 0 && (
              <p><strong>Variants:</strong> {event.merchandiseDetails.variants.join(", ")}</p>
            )}
            <p><strong>Stock Quantity:</strong> {event.merchandiseDetails.stockQuantity || 0}</p>
            <p><strong>Purchase Limit per Participant:</strong> {event.merchandiseDetails.purchaseLimitPerParticipant || 1}</p>
          </div>
        )}

        <div style={{ 
          padding: "1rem", 
          background: canRegister ? "#d1ecf1" : "#f8d7da", 
          borderRadius: "8px",
          marginBottom: "1.5rem"
        }}>
          {canRegister ? (
            <p style={{ margin: 0, color: "#0c5460", fontWeight: "bold" }}>
              ✓ Registration is open! Click below to register.
            </p>
          ) : (
            <p style={{ margin: 0, color: "#721c24", fontWeight: "bold" }}>
              {isDeadlinePassed && "⏰ Registration deadline has passed"}
              {isCapacityFull && "👥 Event is at full capacity"}
              {isStockExhausted && "📦 Merchandise is out of stock"}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={!canRegister}
          style={{
            width: "100%",
            padding: " 1rem",
            background: canRegister ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: canRegister ? "pointer" : "not-allowed"
          }}
        >
          {canRegister ? "Register for this Event" : "Registration Closed"}
        </button>
      </div>

      {showModal && (
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
            <h2>Register for {event.title}</h2>
            
            {event.eventType === "merchandise" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ background: "#fff3cd", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem", color: "#856404" }}>
                  Registration = Payment. Upload proof to proceed.
                </div>

                {event.merchandiseDetails?.sizes?.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>Size</label>
                    <select value={merchSize} onChange={e => setMerchSize(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}>
                      <option value="">-- Select Size --</option>
                      {event.merchandiseDetails.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {event.merchandiseDetails?.colors?.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>Color</label>
                    <select value={merchColor} onChange={e => setMerchColor(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}>
                      <option value="">-- Select Color --</option>
                      {event.merchandiseDetails.colors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {event.merchandiseDetails?.variants?.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>Variant</label>
                    <select value={merchVariant} onChange={e => setMerchVariant(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}>
                      <option value="">-- Select Variant --</option>
                      {event.merchandiseDetails.variants.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>
                    Payment Proof <span style={{ color: "red" }}>*</span>
                  </label>
                  <p style={{ fontSize: "0.8rem", color: "#666", margin: "0 0 0.3rem 0" }}>
                    Enter payment screenshot URL or transaction ID
                  </p>
                  <input
                    type="text"
                    value={paymentProof}
                    onChange={e => setPaymentProof(e.target.value)}
                    placeholder="e.g. https://imgur.com/abc123 or TXN-12345"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>
            )}

            {event.eventType === "normal" && event.customForm && event.customForm.length > 0 ? (
              <div>
                <p style={{ marginBottom: "1rem", color: "#666" }}>
                  Please fill in the following information:
                </p>
                
                {event.customForm.map((field, index) => (
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
                onClick={() => setShowModal(false)}
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

      {user && (user.role === "participant" || user.role === "organizer") && (
        <div style={{ marginTop: "2rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", background: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>💬 Discussion Forum</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {unreadCount > 0 && !showDiscussion && (
                <span style={{ background: "#dc3545", color: "white", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" }}>
                  {unreadCount} new
                </span>
              )}
              <button onClick={() => setShowDiscussion(!showDiscussion)} style={{
                padding: "0.5rem 1rem", background: showDiscussion ? "#6c757d" : "#007bff",
                color: "white", border: "none", borderRadius: "4px", cursor: "pointer",
              }}>
                {showDiscussion ? "Hide Discussion" : "Show Discussion"}
              </button>
            </div>
          </div>

          {showDiscussion && (
            <div>
              {discussionError && (
                <div style={{ padding: "0.75rem", background: "#f8d7da", color: "#721c24", borderRadius: "4px", marginBottom: "1rem" }}>
                  {discussionError}
                </div>
              )}

              <div style={{ padding: "1rem", background: "#f0f0f0", borderRadius: "6px", marginBottom: "1rem" }}>
                {replyTo && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", padding: "0.4rem 0.6rem", background: "#e0e0e0", borderRadius: "4px", fontSize: "0.85rem" }}>
                    <span>↩ Replying to a message</span>
                    <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", fontWeight: "bold" }}>✕</button>
                  </div>
                )}
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Write a message..."
                  rows="3" style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd", resize: "vertical", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <div>
                    {isEventOrganizer && (
                      <label style={{ fontSize: "0.85rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={isAnnouncement} onChange={e => setIsAnnouncement(e.target.checked)} />
                        {" "}Mark as Announcement
                      </label>
                    )}
                  </div>
                  <button onClick={handlePostMessage} disabled={!newMessage.trim()} style={{
                    padding: "0.5rem 1.5rem", background: newMessage.trim() ? "#28a745" : "#ccc",
                    color: "white", border: "none", borderRadius: "4px", cursor: newMessage.trim() ? "pointer" : "not-allowed",
                  }}>
                    {replyTo ? "Reply" : isAnnouncement ? "Post Announcement" : "Post Message"}
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#999", padding: "2rem" }}>No messages yet. Start the discussion!</p>
                ) : (
                  messages.map(msg => renderMessage(msg))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventDetails;
