import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function OrganizerEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [attendedFilter, setAttendedFilter] = useState("all");
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({ totalCount: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [feedbackFilter, setFeedbackFilter] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEvent(data);
        setAttendees(data.attendees || []);
        setAnalytics(data.analytics || {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleMarkAttended = async (ticketId, attendeeRegId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/attend/${ticketId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAttendees(prev =>
        prev.map(a => a._id === attendeeRegId ? { ...a, attended: true } : a)
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchPendingPayments = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/payments/pending/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPendingPayments(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleApprovePayment = async (registrationId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/payments/approve/${registrationId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPendingPayments(prev => prev.filter(p => p.registrationId !== registrationId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectPayment = async (registrationId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/payments/reject/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPendingPayments(prev => prev.filter(p => p.registrationId !== registrationId));
      setRejectModalId(null);
      setRejectReason("");
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchFeedback = async (ratingFilter = "") => {
    setFeedbackLoading(true);
    try {
      const url = ratingFilter
        ? `${import.meta.env.VITE_API_URL}/api/feedback/${id}?rating=${ratingFilter}`
        : `${import.meta.env.VITE_API_URL}/api/feedback/${id}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFeedbacks(data.feedbacks);
      setFeedbackStats(data.stats);
    } catch (err) {
      alert(err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Registration Date", "Ticket ID", "Attended"];
    const rows = attendees.map(a => [
      `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.name || a.email,
      a.email,
      a.registrationDate ? new Date(a.registrationDate).toLocaleDateString() : "",
      a.ticketId || a._id,
      a.attended ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title || "event"}_participants.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAttendees = attendees.filter(a => {
    const name = `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.name || "";
    const matchSearch = search === "" ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase());
    const matchAttended =
      attendedFilter === "all" ||
      (attendedFilter === "attended" && a.attended) ||
      (attendedFilter === "not_attended" && !a.attended);
    return matchSearch && matchAttended;
  });

  const tabStyle = (tab) => ({
    padding: "0.65rem 1.4rem",
    border: "none",
    borderBottom: `3px solid ${activeTab === tab ? "#007bff" : "transparent"}`,
    background: "none",
    color: activeTab === tab ? "#007bff" : "#666",
    fontWeight: activeTab === tab ? "bold" : "normal",
    cursor: "pointer",
    fontSize: "0.95rem",
  });

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;
  if (!event) return null;

  const STATUS_COLORS = {
    draft:     { bg: "#e9ecef", color: "#495057" },
    published: { bg: "#cff4fc", color: "#0c5460" },
    ongoing:   { bg: "#d1e7dd", color: "#0f5132" },
    completed: { bg: "#d4edda", color: "#155724" },
    closed:    { bg: "#f8d7da", color: "#721c24" },
    cancelled: { bg: "#f8d7da", color: "#721c24" },
  };
  const sc = STATUS_COLORS[event.status] || STATUS_COLORS.draft;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/organizer/dashboard")}
        style={{ background: "none", border: "1px solid #ccc", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer", marginBottom: "1.5rem", fontSize: "0.9rem" }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>{event.title}</h1>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ background: sc.bg, color: sc.color, padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.82rem", fontWeight: "bold", textTransform: "capitalize" }}>
              {event.status}
            </span>
            <span style={{ background: event.eventType === "merchandise" ? "#fff3cd" : "#d1ecf1", color: event.eventType === "merchandise" ? "#856404" : "#0c5460", padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.82rem", fontWeight: "bold" }}>
              {event.eventType === "merchandise" ? "Merchandise" : "Normal"}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/organizer/edit/${event._id}`)}
          style={{ background: "#007bff", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          Edit Event
        </button>
        <button
          onClick={() => navigate(`/organizer/scanner/${event._id}`)}
          style={{ background: "#28a745", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginLeft: "0.5rem" }}
        >
          QR Scanner
        </button>
      </div>

      <div style={{ borderBottom: "1px solid #eee", marginBottom: "2rem", display: "flex", gap: "0" }}>
        {["overview", "analytics", ...(event.eventType === "merchandise" ? ["payments"] : []), "participants", "feedback"].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === "payments") fetchPendingPayments(); if (tab === "feedback") { setFeedbackFilter(""); fetchFeedback(); } }} style={tabStyle(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "payments" && analytics.pendingPayments > 0 && (
              <span style={{ marginLeft: "0.4rem", background: "#dc3545", color: "white", borderRadius: "50%", padding: "0.1rem 0.45rem", fontSize: "0.75rem" }}>
                {analytics.pendingPayments}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {[
            { label: "Description", value: event.description },
            { label: "Start Date", value: event.date ? new Date(event.date).toLocaleString() : "—" },
            { label: "End Date", value: event.endDate ? new Date(event.endDate).toLocaleString() : "—" },
            { label: "Registration Deadline", value: event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString() : "—" },
            { label: "Location", value: event.location },
            { label: "Capacity", value: event.capacity },
            { label: "Eligibility", value: event.eligibility || "Open to all" },
            { label: "Registration Fee", value: event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free" },
            { label: "Tags", value: event.tags?.length > 0 ? event.tags.join(", ") : "—" },
          ].map(item => (
            <div key={item.label} style={{ background: "#f9f9f9", borderRadius: "8px", padding: "1rem", border: "1px solid #eee" }}>
              <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
              <div style={{ fontWeight: "500", color: "#333", wordBreak: "break-word" }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "analytics" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Total Registrations", value: analytics.totalRegistrations ?? 0, color: "#007bff" },
              { label: "Attended", value: analytics.attendedCount ?? 0, color: "#28a745" },
              { label: "Revenue", value: `₹${analytics.revenue ?? 0}`, color: "#fd7e14" },
              { label: "Attendance Rate", value: `${analytics.attendanceRate ?? 0}%`, color: "#6f42c1" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.3rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "1.5rem", border: "1px solid #eee" }}>
            <h3 style={{ marginTop: 0 }}>Registration Fill Rate</h3>
            <div style={{ background: "#e9ecef", borderRadius: "8px", height: "20px", overflow: "hidden" }}>
              <div style={{
                background: "#007bff",
                height: "100%",
                width: `${event.capacity > 0 ? Math.min(((analytics.totalRegistrations ?? 0) / event.capacity) * 100, 100) : 0}%`,
                transition: "width 0.5s",
              }} />
            </div>
            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
              {analytics.totalRegistrations ?? 0} / {event.capacity} spots filled ({event.capacity > 0 ? Math.round(((analytics.totalRegistrations ?? 0) / event.capacity) * 100) : 0}%)
            </p>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div>
          <h3 style={{ marginTop: 0 }}>Pending Payment Approvals</h3>
          {paymentLoading ? (
            <p>Loading...</p>
          ) : pendingPayments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#f9f9f9", borderRadius: "8px" }}>
              <p style={{ color: "#666" }}>No pending payments to review.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {pendingPayments.map(p => (
                <div key={p.registrationId} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1.25rem", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <h4 style={{ margin: "0 0 0.3rem 0" }}>{p.user.name}</h4>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>{p.user.email}</p>
                      {p.user.contactNumber && <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#888" }}>Phone: {p.user.contactNumber}</p>}
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#888" }}>
                        Registered: {new Date(p.registrationDate).toLocaleDateString()}
                      </p>
                      {p.merchandiseSelections && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                          {p.merchandiseSelections.size && <span style={{ marginRight: "0.75rem" }}>Size: <strong>{p.merchandiseSelections.size}</strong></span>}
                          {p.merchandiseSelections.color && <span style={{ marginRight: "0.75rem" }}>Color: <strong>{p.merchandiseSelections.color}</strong></span>}
                          {p.merchandiseSelections.variant && <span>Variant: <strong>{p.merchandiseSelections.variant}</strong></span>}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <a href={p.paymentProof} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff", fontSize: "0.9rem" }}>
                          View Payment Proof
                        </a>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleApprovePayment(p.registrationId)} style={{ background: "#28a745", color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
                          Approve
                        </button>
                        <button onClick={() => { setRejectModalId(p.registrationId); setRejectReason(""); }} style={{ background: "#dc3545", color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rejectModalId && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
              <div style={{ background: "white", padding: "2rem", borderRadius: "8px", maxWidth: "400px", width: "90%" }}>
                <h3 style={{ marginTop: 0 }}>Reject Payment</h3>
                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Enter rejection reason..."
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd", marginBottom: "1rem" }}
                />
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => handleRejectPayment(rejectModalId)} style={{ flex: 1, background: "#dc3545", color: "white", border: "none", padding: "0.6rem", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                    Confirm Reject
                  </button>
                  <button onClick={() => setRejectModalId(null)} style={{ flex: 1, background: "#6c757d", color: "white", border: "none", padding: "0.6rem", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <div style={{ background: "#fff3cd", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#856404" }}>{analytics.pendingPayments || 0}</div>
              <div style={{ fontSize: "0.85rem", color: "#856404" }}>Pending</div>
            </div>
            <div style={{ background: "#d4edda", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#155724" }}>{analytics.approvedPayments || 0}</div>
              <div style={{ fontSize: "0.85rem", color: "#155724" }}>Approved</div>
            </div>
            <div style={{ background: "#f8d7da", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#721c24" }}>{analytics.rejectedPayments || 0}</div>
              <div style={{ fontSize: "0.85rem", color: "#721c24" }}>Rejected</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "participants" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", flex: 1 }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: "0.5rem 0.75rem", border: "1px solid #ddd", borderRadius: "6px", minWidth: "220px", fontSize: "0.9rem" }}
              />
              <select
                value={attendedFilter}
                onChange={e => setAttendedFilter(e.target.value)}
                style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: "6px", fontSize: "0.9rem" }}
              >
                <option value="all">All Participants</option>
                <option value="attended">Attended</option>
                <option value="not_attended">Not Attended</option>
              </select>
            </div>
            <button
              onClick={handleExportCSV}
              style={{ background: "#28a745", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
            >
              Export CSV
            </button>
          </div>

          {filteredAttendees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#f9f9f9", borderRadius: "8px" }}>
              <p style={{ color: "#666" }}>No participants found.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["Name", "Email", "Registration Date", "Ticket ID", "Attended", "Action"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map(a => (
                    <tr key={a._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {`${a.firstName || ""} ${a.lastName || ""}`.trim() || a.name || "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>{a.email}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {a.registrationDate ? new Date(a.registrationDate).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {a.ticketId || "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{
                          background: a.attended ? "#d4edda" : "#f8d7da",
                          color: a.attended ? "#155724" : "#721c24",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "10px",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                        }}>
                          {a.attended ? "Yes" : "No"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {!a.attended && (
                          <button
                            onClick={() => handleMarkAttended(a.ticketId, a._id)}
                            style={{ background: "#28a745", color: "white", border: "none", padding: "0.3rem 0.7rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.82rem" }}
                          >
                            Mark Attended
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "1rem" }}>
            Showing {filteredAttendees.length} of {attendees.length} participants
          </p>
        </div>
      )}

      {activeTab === "feedback" && (
        <div>
          {feedbackLoading ? (
            <p>Loading feedback...</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                <div style={{ textAlign: "center", minWidth: "120px" }}>
                  <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: "#333", lineHeight: 1 }}>
                    {feedbackStats.averageRating}
                  </div>
                  <div style={{ margin: "0.4rem 0" }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} style={{ fontSize: "1.2rem", color: s <= Math.round(feedbackStats.averageRating) ? "#ffc107" : "#e0e0e0" }}>★</span>
                    ))}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#888" }}>
                    {feedbackStats.totalCount} {feedbackStats.totalCount === 1 ? "review" : "reviews"}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "250px" }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = feedbackStats.distribution[star] || 0;
                    const pct = feedbackStats.totalCount > 0 ? (count / feedbackStats.totalCount) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", cursor: "pointer" }}
                        onClick={() => { const f = feedbackFilter === String(star) ? "" : String(star); setFeedbackFilter(f); fetchFeedback(f); }}
                      >
                        <span style={{ fontSize: "0.85rem", width: "12px", textAlign: "right", color: "#666" }}>{star}</span>
                        <span style={{ fontSize: "0.85rem", color: "#ffc107" }}>★</span>
                        <div style={{ flex: 1, background: "#e9ecef", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                          <div style={{ background: feedbackFilter === String(star) ? "#007bff" : "#ffc107", height: "100%", width: `${pct}%`, borderRadius: "4px", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#888", width: "30px", textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {feedbackFilter && (
                <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", color: "#666" }}>Filtering by {feedbackFilter} star{feedbackFilter !== "1" ? "s" : ""}</span>
                  <button onClick={() => { setFeedbackFilter(""); fetchFeedback(""); }} style={{ background: "none", border: "1px solid #ddd", borderRadius: "12px", padding: "0.2rem 0.6rem", cursor: "pointer", fontSize: "0.8rem", color: "#666" }}>✕ Clear</button>
                </div>
              )}

              {feedbacks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "#f9f9f9", borderRadius: "8px" }}>
                  <p style={{ color: "#666", fontSize: "1.1rem" }}>
                    {feedbackFilter ? "No reviews with this rating" : "No feedback received yet"}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {feedbacks.map(fb => (
                    <div key={fb._id} style={{ padding: "1rem 1.25rem", background: "white", border: "1px solid #eee", borderRadius: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <div>
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} style={{ fontSize: "0.95rem", color: s <= fb.rating ? "#ffc107" : "#e0e0e0" }}>★</span>
                          ))}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{new Date(fb.createdAt).toLocaleDateString()}</span>
                      </div>
                      {fb.comment && <p style={{ margin: "0.3rem 0 0 0", color: "#444", lineHeight: 1.5, fontSize: "0.95rem" }}>{fb.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganizerEventDetail;
