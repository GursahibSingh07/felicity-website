import { useState, useEffect } from "react";

function ManageOrganizers() {
  const token = localStorage.getItem("token");
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [resetRequests, setResetRequests] = useState([]);
  const [showResetRequests, setShowResetRequests] = useState(false);
  const [resetCredentials, setResetCredentials] = useState(null);
  const [formData, setFormData] = useState({
    organizerName: "",
    category: "",
    description: "",
    email: "",
    password: "",
  });

  const fetchOrganizers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/organizers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrganizers(data.organizers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrganizers(); fetchResetRequests(); }, []);

  const fetchResetRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResetRequests(data);
      }
    } catch {}
  };

  const handleApproveReset = async (requestId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-requests/${requestId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResetCredentials(data.credentials);
      setSuccess("Password reset approved!");
      fetchResetRequests();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectReset = async (requestId) => {
    const comment = prompt("Enter rejection reason:");
    if (comment === null) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-requests/${requestId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess("Request rejected.");
      fetchResetRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCredentials(null);
    try {
      const payload = { organizerName: formData.organizerName, category: formData.category, description: formData.description };
      if (formData.email) payload.email = formData.email;
      if (formData.password) payload.password = formData.password;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/create-organizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCredentials(data.credentials);
      setSuccess("Organizer created successfully!");
      setFormData({ organizerName: "", category: "", description: "", email: "", password: "" });
      fetchOrganizers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/organizers/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrganizers(prev => prev.map(o => o._id === id ? { ...o, isDisabled: data.organizer.isDisabled } : o));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this organizer and all their data? This cannot be undone.")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/organizers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrganizers(prev => prev.filter(o => o._id !== id));
      setSuccess("Organizer deleted permanently.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt("Enter new password for this organizer (min 8 chars, upper, lower, number, special):");
    if (!newPassword) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-organizer-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizerId: id, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Password reset successfully. Share the new password with the organizer.");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>Manage Clubs / Organizers</h1>
        <button
          onClick={() => { setShowForm(!showForm); setCredentials(null); setError(""); setSuccess(""); }}
          style={{ background: showForm ? "#6c757d" : "#28a745", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
        >
          {showForm ? "Cancel" : "+ Add New Club/Organizer"}
        </button>
      </div>

      {error && <div style={{ background: "#fee", color: "#c33", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #fcc" }}>{error}</div>}
      {success && <div style={{ background: "#efe", color: "#2a7a2a", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #cfc" }}>{success}</div>}

      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => { setShowResetRequests(!showResetRequests); setResetCredentials(null); }}
          style={{
            background: showResetRequests ? "#6c757d" : "#e67e22",
            color: "white", border: "none", padding: "0.6rem 1.4rem",
            borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem",
            position: "relative",
          }}
        >
          {showResetRequests ? "Hide Reset Requests" : "Password Reset Requests"}
          {resetRequests.filter(r => r.status === "pending").length > 0 && (
            <span style={{
              position: "absolute", top: "-8px", right: "-8px",
              background: "#dc3545", color: "white", borderRadius: "50%",
              width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: "bold",
            }}>
              {resetRequests.filter(r => r.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {showResetRequests && (
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Password Reset Requests</h2>

          {resetCredentials && (
            <div style={{ marginBottom: "1rem", background: "#d4edda", border: "1px solid #28a745", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#155724" }}>New Credentials Generated</h4>
              <p style={{ margin: "0.2rem 0" }}><strong>Organizer:</strong> {resetCredentials.organizerName}</p>
              <p style={{ margin: "0.2rem 0" }}><strong>Email:</strong> <code>{resetCredentials.email}</code></p>
              <p style={{ margin: "0.2rem 0" }}><strong>New Password:</strong> <code>{resetCredentials.newPassword}</code></p>
              <p style={{ color: "#856404", fontSize: "0.82rem", marginTop: "0.5rem", marginBottom: 0 }}>
                Copy and share the new password with the organizer.
              </p>
            </div>
          )}

          {resetRequests.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "1rem" }}>No reset requests.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["Organizer", "Email", "Reason", "Status", "Date", "Actions"].map(h => (
                      <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "2px solid #ddd" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resetRequests.map(req => (
                    <tr key={req._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: "bold" }}>{req.organizer?.organizerName || "—"}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>{req.organizer?.email || "—"}</td>
                      <td style={{ padding: "0.6rem 0.75rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{req.reason}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <span style={{
                          padding: "0.2rem 0.5rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "bold", color: "white",
                          background: req.status === "pending" ? "#ffc107" : req.status === "approved" ? "#28a745" : "#dc3545",
                        }}>{req.status.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: "#666" }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        {req.status === "pending" ? (
                          <div style={{ display: "flex", gap: "0.3rem" }}>
                            <button onClick={() => handleApproveReset(req._id)} style={{
                              background: "#28a745", color: "white", border: "none", padding: "0.3rem 0.7rem",
                              borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold",
                            }}>Approve</button>
                            <button onClick={() => handleRejectReset(req._id)} style={{
                              background: "#dc3545", color: "white", border: "none", padding: "0.3rem 0.7rem",
                              borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold",
                            }}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#888" }}>
                            {req.adminComment && `"${req.adminComment}"`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Create New Organizer Account</h2>
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
            Leave email and password blank to auto-generate credentials.
          </p>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.85rem", color: "#555" }}>Organizer / Club Name *</label>
              <input value={formData.organizerName} onChange={e => setFormData({ ...formData, organizerName: e.target.value })} required style={{ width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#555" }}>Category *</label>
              <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required placeholder="e.g. Technical, Cultural, Sports" style={{ width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#555" }}>Email (optional)</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Auto-generated if blank" style={{ width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.85rem", color: "#555" }}>Description *</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required rows="3" style={{ width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#555" }}>Password (optional)</label>
              <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Auto-generated if blank" style={{ width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="submit" style={{ background: "#28a745", color: "white", border: "none", padding: "0.65rem 1.5rem", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", width: "100%" }}>
                Create Account
              </button>
            </div>
          </form>

          {credentials && (
            <div style={{ marginTop: "1.5rem", background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.75rem 0", color: "#856404" }}>Generated Credentials — Share with Organizer</h3>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "0.95rem" }}>
                <strong>Email:</strong>
                <code style={{ background: "#f8f9fa", padding: "0.3rem 0.6rem", borderRadius: "4px", fontFamily: "monospace" }}>{credentials.email}</code>
                <strong>Password:</strong>
                <code style={{ background: "#f8f9fa", padding: "0.3rem 0.6rem", borderRadius: "4px", fontFamily: "monospace" }}>{credentials.password}</code>
              </div>
              <p style={{ color: "#856404", fontSize: "0.82rem", marginTop: "0.75rem", marginBottom: 0 }}>
                ⚠ Copy these credentials now. The password cannot be viewed again after leaving this page.
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.9rem", color: "#666" }}>
        <span>Total: <strong>{organizers.length}</strong></span>
        <span>Active: <strong>{organizers.filter(o => !o.isDisabled).length}</strong></span>
        <span>Disabled: <strong>{organizers.filter(o => o.isDisabled).length}</strong></span>
      </div>

      {organizers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#f9f9f9", borderRadius: "8px" }}>
          <p style={{ color: "#666" }}>No organizers registered yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", background: "white" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                {["Name", "Email", "Category", "Events", "Status", "Created", "Actions"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {organizers.map(org => (
                <tr key={org._id} style={{ borderBottom: "1px solid #eee", opacity: org.isDisabled ? 0.6 : 1 }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>{org.organizerName || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{org.email}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ background: "#e9ecef", padding: "0.2rem 0.6rem", borderRadius: "10px", fontSize: "0.8rem" }}>{org.category || "—"}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>{org.eventCount ?? 0}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{
                      background: org.isDisabled ? "#f8d7da" : "#d4edda",
                      color: org.isDisabled ? "#721c24" : "#155724",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "10px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                    }}>
                      {org.isDisabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#666" }}>
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleToggle(org._id)}
                        style={{
                          background: org.isDisabled ? "#28a745" : "#fd7e14",
                          color: "white", border: "none", padding: "0.3rem 0.7rem",
                          borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold",
                        }}
                      >
                        {org.isDisabled ? "Enable" : "Disable"}
                      </button>
                      <button
                        onClick={() => handleResetPassword(org._id)}
                        style={{ background: "#007bff", color: "white", border: "none", padding: "0.3rem 0.7rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDelete(org._id)}
                        style={{ background: "#dc3545", color: "white", border: "none", padding: "0.3rem 0.7rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageOrganizers;
