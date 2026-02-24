import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateEvent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    capacity: "",
    status: "draft",
    registrationDeadline: "",
    eventType: "normal",
    eligibility: "All participants",
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMerchandiseChange = (e) => {
    setMerchandiseDetails({
      ...merchandiseDetails,
      [e.target.name]: e.target.value,
    });
  };

  const addFormField = () => {
    setCustomForm([
      ...customForm,
      {
        fieldName: "",
        fieldType: "text",
        fieldLabel: "",
        required: false,
        options: [],
      },
    ]);
  };

  const updateFormField = (index, field, value) => {
    const updated = [...customForm];
    updated[index][field] = value;
    // Auto-generate fieldName from label
    if (field === "fieldLabel") {
      updated[index].fieldName = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    }
    setCustomForm(updated);
  };

  const removeFormField = (index) => {
    setCustomForm(customForm.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate dates
    const startDate = new Date(formData.date);
    const endDate = new Date(formData.endDate);
    const deadline = new Date(formData.registrationDeadline);

    if (endDate <= startDate) {
      setError("Event end date must be after start date");
      return;
    }

    if (deadline >= startDate) {
      setError("Registration deadline must be before event start date");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      };

      if (formData.eventType === "normal" && customForm.length > 0) {
        payload.customForm = customForm;
      }

      if (formData.eventType === "merchandise") {
        payload.merchandiseDetails = {
          sizes: merchandiseDetails.sizes.split(",").map(s => s.trim()).filter(s => s),
          colors: merchandiseDetails.colors.split(",").map(c => c.trim()).filter(c => c),
          variants: merchandiseDetails.variants.split(",").map(v => v.trim()).filter(v => v),
          stockQuantity: Number(merchandiseDetails.stockQuantity),
          purchaseLimitPerParticipant: Number(merchandiseDetails.purchaseLimitPerParticipant),
        };
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "680px" }}>
        <h1 style={{ textAlign: "center", color: "#0f172a", fontSize: "1.75rem", fontWeight: "800", letterSpacing: "-0.03em", margin: "0 0 0.3rem" }}>Create Event</h1>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.75rem" }}>Fill in the details below to publish your event</p>

        {error && <p style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem", marginBottom: "1rem", border: "1px solid #fecaca" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          background: "white",
          padding: "2.25rem 2rem",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Event Name *</label>
          <input
            name="title"
            placeholder="e.g. Annual Tech Hackathon"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Description *</label>
          <textarea
            name="description"
            placeholder="Describe what the event is about..."
            onChange={handleChange}
            required
            rows="4"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Event Type</label>
          <select name="eventType" onChange={handleChange} value={formData.eventType}>
            <option value="normal">Normal Event (Individual Registration)</option>
            <option value="merchandise">Merchandise Event (Individual Purchase)</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Start Date *</label>
            <input type="date" name="date" onChange={handleChange} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>End Date *</label>
            <input type="date" name="endDate" onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Registration Deadline *</label>
          <input type="date" name="registrationDeadline" onChange={handleChange} required />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Location *</label>
          <input name="location" placeholder="e.g. Room 101, Main Building" onChange={handleChange} required />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Eligibility</label>
          <select name="eligibility" value={formData.eligibility} onChange={handleChange}>
            <option value="All participants">All Participants</option>
            <option value="IIIT students only">IIIT Students Only</option>
            <option value="Non-IIIT participants">Non-IIIT Participants</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Registration Limit *</label>
            <input type="number" name="capacity" placeholder="e.g. 100" min="1" onChange={handleChange} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Registration Fee (₹)</label>
            <input type="number" name="registrationFee" placeholder="0 for free" min="0" value={formData.registrationFee} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Tags</label>
          <input name="tags" placeholder="workshop, coding, beginner (comma-separated)" value={formData.tags} onChange={handleChange} />
        </div>

        {formData.eventType === "normal" && (
          <div style={{ border: "1.5px solid #e2e8f0", padding: "1.25rem", borderRadius: "12px", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.2rem" }}>Custom Registration Fields</h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                  Participants will fill these when registering
                </p>
              </div>
              <button
                type="button"
                onClick={addFormField}
                style={{ background: "#6366f1", color: "white", border: "none", padding: "0.45rem 1rem", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                + Add Field
              </button>
            </div>

            {customForm.length === 0 && (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: "0.9rem", background: "white", borderRadius: "10px", border: "1px dashed #e2e8f0" }}>
                No custom fields yet. Click "+ Add Field" to start.
              </div>
            )}

            {customForm.map((field, index) => (
              <div key={index} style={{ marginBottom: "0.75rem", padding: "1rem 1rem 0.75rem", background: "white", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6366f1" }}>Field {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeFormField(index)}
                    style={{ background: "none", color: "#ef4444", border: "none", padding: 0, fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}
                  >
                    ✕ Remove
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.6rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Label *</label>
                    <input
                      placeholder="e.g. Phone Number"
                      value={field.fieldLabel}
                      onChange={(e) => updateFormField(index, "fieldLabel", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Type</label>
                    <select
                      value={field.fieldType}
                      onChange={(e) => updateFormField(index, "fieldType", e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="file">File Upload</option>
                    </select>
                  </div>
                </div>

                {field.fieldType === "select" && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Dropdown Options</label>
                    <input
                      placeholder="Option 1, Option 2, Option 3"
                      value={field.options.join(", ")}
                      onChange={(e) => updateFormField(index, "options", e.target.value.split(",").map(o => o.trim()))}
                      style={{ width: "100%" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Separate options with commas</span>
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.83rem", color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateFormField(index, "required", e.target.checked)}
                  />
                  Required — participants must fill this field
                </label>

                {field.fieldName && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "#94a3b8" }}>
                    Internal key: <code style={{ background: "#f1f5f9", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>{field.fieldName}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {formData.eventType === "merchandise" && (
          <div style={{ border: "1.5px solid #e2e8f0", padding: "1.25rem", borderRadius: "12px", background: "#f8fafc" }}>
            <h3 style={{ margin: "0 0 0.75rem" }}>Merchandise Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Available Sizes</label>
                <input name="sizes" placeholder="S, M, L, XL" value={merchandiseDetails.sizes} onChange={handleMerchandiseChange} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Available Colors</label>
                <input name="colors" placeholder="Red, Blue, Black" value={merchandiseDetails.colors} onChange={handleMerchandiseChange} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Variants</label>
                <input name="variants" placeholder="Regular, Premium" value={merchandiseDetails.variants} onChange={handleMerchandiseChange} style={{ width: "100%" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Stock Quantity</label>
                  <input type="number" name="stockQuantity" min="0" value={merchandiseDetails.stockQuantity} onChange={handleMerchandiseChange} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.2rem" }}>Limit Per Person</label>
                  <input type="number" name="purchaseLimitPerParticipant" min="1" value={merchandiseDetails.purchaseLimitPerParticipant} onChange={handleMerchandiseChange} style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "0.3rem" }}>Publish Status</label>
          <select name="status" onChange={handleChange}>
            <option value="draft">Save as Draft</option>
            <option value="published">Publish Now</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            background: "linear-gradient(135deg, #10b981, #34d399)",
            color: "white",
            padding: "0.8rem",
            border: "none",
            borderRadius: "10px",
            fontSize: "1rem",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
            cursor: "pointer",
          }}
        >
          Create Event
        </button>
      </form>
      </div>
    </div>
  );
}

export default CreateEvent;
