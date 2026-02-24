import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    registrationDeadline: "",
    location: "",
    capacity: "",
    status: "draft",
    eventType: "normal",
    eligibility: "",
    registrationFee: 0,
    tags: "",
  });
  const [customForm, setCustomForm] = useState([]);
  const [merchandiseDetails, setMerchandiseDetails] = useState({
    sizes: "",
    colors: "",
    variants: "",
    stockQuantity: 0,
    purchaseLimitPerParticipant: 1,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasRegistrations, setHasRegistrations] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEvent(data);
        setHasRegistrations(data.hasRegistrations || false);
        setFormData({
          title: data.title || "",
          description: data.description || "",
          date: data.date?.split("T")[0] || "",
          endDate: data.endDate?.split("T")[0] || "",
          registrationDeadline: data.registrationDeadline?.split("T")[0] || "",
          location: data.location || "",
          capacity: data.capacity || "",
          status: data.status || "draft",
          eventType: data.eventType || "normal",
          eligibility: data.eligibility || "All participants",
          registrationFee: data.registrationFee || 0,
          tags: (data.tags || []).join(", "),
        });
        if (data.customForm) setCustomForm(data.customForm);
        if (data.merchandiseDetails) {
          setMerchandiseDetails({
            sizes: (data.merchandiseDetails.sizes || []).join(", "),
            colors: (data.merchandiseDetails.colors || []).join(", "),
            variants: (data.merchandiseDetails.variants || []).join(", "),
            stockQuantity: data.merchandiseDetails.stockQuantity || 0,
            purchaseLimitPerParticipant: data.merchandiseDetails.purchaseLimitPerParticipant || 1,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const isLocked = event && ["ongoing", "completed", "closed", "cancelled"].includes(event.status);
  const isPublished = event?.status === "published";
  const isDraft = event?.status === "draft";
  const publishedWritable = ["description", "registrationDeadline", "capacity"];

  const handleChange = (e) => {
    if (isLocked) return;
    if (isPublished && !publishedWritable.includes(e.target.name)) return;
    if (isPublished && e.target.name === "capacity" && Number(e.target.value) < Number(formData.capacity)) {
      setError("Cannot reduce capacity after publishing.");
      return;
    }
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMerchandiseChange = (e) => {
    if (isLocked || isPublished) return;
    setMerchandiseDetails({ ...merchandiseDetails, [e.target.name]: e.target.value });
  };

  const addFormField = () => {
    if (hasRegistrations) return;
    setCustomForm([...customForm, { fieldName: "", fieldType: "text", fieldLabel: "", required: false, options: [] }]);
  };

  const updateFormField = (index, field, value) => {
    if (hasRegistrations) return;
    const updated = [...customForm];
    updated[index][field] = value;
    setCustomForm(updated);
  };

  const removeFormField = (index) => {
    if (hasRegistrations) return;
    setCustomForm(customForm.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    if (hasRegistrations) return;
    const updated = [...customForm];
    const target = index + direction;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setCustomForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isLocked) {
      const startDate = new Date(formData.date);
      const endDate = new Date(formData.endDate);
      const deadline = new Date(formData.registrationDeadline);
      if (endDate <= startDate) { setError("Event end date must be after start date"); return; }
      if (deadline >= startDate) { setError("Registration deadline must be before event start date"); return; }
    }
    try {
      const payload = { ...formData, tags: formData.tags.split(",").map(t => t.trim()).filter(t => t) };
      if (formData.eventType === "normal" && !isLocked) payload.customForm = customForm;
      if (formData.eventType === "merchandise" && !isLocked) {
        payload.merchandiseDetails = {
          sizes: merchandiseDetails.sizes.split(",").map(s => s.trim()).filter(s => s),
          colors: merchandiseDetails.colors.split(",").map(c => c.trim()).filter(c => c),
          variants: merchandiseDetails.variants.split(",").map(v => v.trim()).filter(v => v),
          stockQuantity: Number(merchandiseDetails.stockQuantity),
          purchaseLimitPerParticipant: Number(merchandiseDetails.purchaseLimitPerParticipant),
        };
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const fieldReadonly = (name) =>
    isLocked || (isPublished && !publishedWritable.includes(name));

  const inputStyle = (name) => ({
    padding: "0.6rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "0.95rem",
    width: "100%",
    boxSizing: "border-box",
    background: fieldReadonly(name) ? "#f1f5f9" : "white",
    cursor: fieldReadonly(name) ? "not-allowed" : "text",
    transition: "border-color 0.2s",
  });

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <button onClick={() => navigate("/organizer/dashboard")} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", padding: "0.4rem 1rem", borderRadius: "10px", cursor: "pointer", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#475569", fontWeight: "500" }}>
        ← Back
      </button>

      <h1 style={{ marginBottom: "0.25rem" }}>Edit Event</h1>
      <p style={{ color: "#64748b", marginTop: 0, fontSize: "0.9rem" }}>
        Status: <strong style={{ textTransform: "capitalize" }}>{event?.status}</strong>
        {isLocked && " — This event is locked. No edits allowed."}
        {isPublished && " — Limited edits: description, deadline extension, capacity increase only."}
        {hasRegistrations && isDraft && " — Custom form locked (registrations exist)."}
      </p>

      {error && <p style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem", borderRadius: "10px", border: "1px solid #fecaca" }}>{error}</p>}

      {isLocked ? (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "1.5rem" }}>
          <p style={{ color: "#64748b" }}>This event cannot be edited in its current status (<strong>{event?.status}</strong>).</p>
          <button onClick={() => navigate("/organizer/dashboard")} style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Event Title {isPublished && "(locked)"}</label>
            <input name="title" value={formData.title} onChange={handleChange} readOnly={!!isPublished} required style={inputStyle("title")} />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" style={{ ...inputStyle("description"), resize: "vertical" }} />
          </div>

          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Event Type {isPublished && "(locked)"}</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange} disabled={!!isPublished} style={inputStyle("eventType")}>
              <option value="normal">Normal Event</option>
              <option value="merchandise">Merchandise Event</option>
            </select>
          </div>

          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Start Date {isPublished && "(locked)"}</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} readOnly={!!isPublished} required style={inputStyle("date")} />
          </div>

          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>End Date {isPublished && "(locked)"}</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} readOnly={!!isPublished} required style={inputStyle("endDate")} />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Registration Deadline</label>
            <input type="date" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required style={inputStyle("registrationDeadline")} />
          </div>

          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Location {isPublished && "(locked)"}</label>
            <input name="location" value={formData.location} onChange={handleChange} readOnly={!!isPublished} required style={inputStyle("location")} />
          </div>

          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Eligibility {isPublished && "(locked)"}</label>
            <input name="eligibility" value={formData.eligibility} onChange={handleChange} readOnly={!!isPublished} style={inputStyle("eligibility")} />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Capacity {isPublished && "(can only increase)"}</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min={isPublished ? String(formData.capacity) : "1"} required style={inputStyle("capacity")} />
          </div>

          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Registration Fee {isPublished && "(locked)"}</label>
            <input type="number" name="registrationFee" value={formData.registrationFee} onChange={handleChange} readOnly={!!isPublished} min="0" style={inputStyle("registrationFee")} />
          </div>

          <div style={{ opacity: isPublished ? 0.5 : 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#475569" }}>Tags (comma-separated) {isPublished && "(locked)"}</label>
            <input name="tags" value={formData.tags} onChange={handleChange} readOnly={!!isPublished} style={inputStyle("tags")} />
          </div>

          {formData.eventType === "normal" && (
            <div style={{ border: "1.5px solid #e2e8f0", padding: "1rem", borderRadius: "12px", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0 }}>Custom Registration Form</h3>
                {hasRegistrations && (
                  <span style={{ fontSize: "0.8rem", background: "#fef3c7", color: "#92400e", padding: "0.2rem 0.6rem", borderRadius: "20px", fontWeight: "600" }}>
                    Locked (registrations exist)
                  </span>
                )}
              </div>
              {customForm.map((field, index) => (
                <div key={index} style={{ marginBottom: "1rem", padding: "1rem", background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", opacity: hasRegistrations ? 0.6 : 1 }}>
                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                    <button type="button" onClick={() => moveField(index, -1)} disabled={hasRegistrations || index === 0} style={{ padding: "0.2rem 0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", background: "white" }}>↑</button>
                    <button type="button" onClick={() => moveField(index, 1)} disabled={hasRegistrations || index === customForm.length - 1} style={{ padding: "0.2rem 0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", background: "white" }}>↓</button>
                    <button type="button" onClick={() => removeFormField(index)} disabled={hasRegistrations} style={{ padding: "0.2rem 0.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>✕</button>
                  </div>
                  <input placeholder="Field Name" value={field.fieldName} onChange={(e) => updateFormField(index, "fieldName", e.target.value)} disabled={hasRegistrations} style={{ marginBottom: "0.5rem", width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box" }} />
                  <input placeholder="Field Label" value={field.fieldLabel} onChange={(e) => updateFormField(index, "fieldLabel", e.target.value)} disabled={hasRegistrations} style={{ marginBottom: "0.5rem", width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box" }} />
                  <select value={field.fieldType} onChange={(e) => updateFormField(index, "fieldType", e.target.value)} disabled={hasRegistrations} style={{ marginBottom: "0.5rem", width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "8px" }}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select Dropdown</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="file">File Upload</option>
                  </select>
                  {(field.fieldType === "select" || field.fieldType === "radio") && (
                    <input placeholder="Options (comma-separated)" value={Array.isArray(field.options) ? field.options.join(", ") : ""} onChange={(e) => updateFormField(index, "options", e.target.value.split(",").map(o => o.trim()))} disabled={hasRegistrations} style={{ marginBottom: "0.5rem", width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box" }} />
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                    <input type="checkbox" checked={field.required} onChange={(e) => updateFormField(index, "required", e.target.checked)} disabled={hasRegistrations} />
                    Required
                  </label>
                </div>
              ))}
              {!hasRegistrations && (
                <button type="button" onClick={addFormField} style={{ background: "#6366f1", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  + Add Field
                </button>
              )}
            </div>
          )}

          {formData.eventType === "merchandise" && (
            <div style={{ border: "1.5px solid #e2e8f0", padding: "1rem", borderRadius: "12px", background: "#f8fafc", opacity: isPublished ? 0.5 : 1 }}>
              <h3 style={{ marginTop: 0 }}>Merchandise Details {isPublished && "(locked)"}</h3>
              {[
                { name: "sizes", placeholder: "Available Sizes (comma-separated)" },
                { name: "colors", placeholder: "Available Colors (comma-separated)" },
                { name: "variants", placeholder: "Variants (comma-separated)" },
              ].map(f => (
                <input key={f.name} name={f.name} placeholder={f.placeholder} value={merchandiseDetails[f.name]} onChange={handleMerchandiseChange} readOnly={!!isPublished} style={{ marginBottom: "0.5rem", width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box" }} />
              ))}
              <input type="number" name="stockQuantity" placeholder="Stock Quantity" min="0" value={merchandiseDetails.stockQuantity} onChange={handleMerchandiseChange} readOnly={!!isPublished} style={{ marginBottom: "0.5rem", width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box" }} />
              <input type="number" name="purchaseLimitPerParticipant" placeholder="Purchase Limit Per Participant" min="1" value={merchandiseDetails.purchaseLimitPerParticipant} onChange={handleMerchandiseChange} readOnly={!!isPublished} style={{ width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box" }} />
            </div>
          )}

          {isDraft && (
            <div>
              <label style={{ fontSize: "0.85rem", color: "#475569" }}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={inputStyle("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          )}

          <button type="submit" style={{ background: "linear-gradient(135deg, #10b981, #34d399)", color: "white", padding: "0.75rem", border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}>
            Update Event
          </button>
        </form>
      )}
    </div>
  );
}

export default EditEvent;
