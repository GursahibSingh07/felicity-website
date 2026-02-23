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
    <div style={{ padding: "2rem" }}>
      <h1>Create Event</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <input
          name="title"
          placeholder="Event Name"
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Event Description"
          onChange={handleChange}
          required
          rows="4"
        />

        <select name="eventType" onChange={handleChange} value={formData.eventType}>
          <option value="normal">Normal Event (Individual Registration)</option>
          <option value="merchandise">Merchandise Event (Individual Purchase)</option>
        </select>

        <label>Event Start Date</label>
        <input
          type="date"
          name="date"
          onChange={handleChange}
          required
        />

        <label>Event End Date</label>
        <input
          type="date"
          name="endDate"
          onChange={handleChange}
          required
        />

        <label>Registration Deadline</label>
        <input
          type="date"
          name="registrationDeadline"
          onChange={handleChange}
          required
        />

        <input
          name="location"
          placeholder="Location"
          onChange={handleChange}
          required
        />

        <input
          name="eligibility"
          placeholder="Eligibility (e.g., All participants, IIIT students only)"
          value={formData.eligibility}
          onChange={handleChange}
        />

        <input
          type="number"
          name="capacity"
          placeholder="Registration Limit"
          min="1"
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="registrationFee"
          placeholder="Registration Fee (0 for free)"
          min="0"
          value={formData.registrationFee}
          onChange={handleChange}
        />

        <input
          name="tags"
          placeholder="Event Tags (comma-separated, e.g., workshop, coding, beginner)"
          value={formData.tags}
          onChange={handleChange}
        />

        {formData.eventType === "normal" && (
          <div style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "8px" }}>
            <h3>Custom Registration Form</h3>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              Add custom fields for participant registration
            </p>

            {customForm.map((field, index) => (
              <div key={index} style={{ marginBottom: "1rem", padding: "1rem", background: "#f9f9f9", borderRadius: "4px" }}>
                <input
                  placeholder="Field Name (e.g., phone_number)"
                  value={field.fieldName}
                  onChange={(e) => updateFormField(index, "fieldName", e.target.value)}
                  style={{ marginBottom: "0.5rem", width: "100%" }}
                />
                <input
                  placeholder="Field Label (e.g., Phone Number)"
                  value={field.fieldLabel}
                  onChange={(e) => updateFormField(index, "fieldLabel", e.target.value)}
                  style={{ marginBottom: "0.5rem", width: "100%" }}
                />
                <select
                  value={field.fieldType}
                  onChange={(e) => updateFormField(index, "fieldType", e.target.value)}
                  style={{ marginBottom: "0.5rem", width: "100%" }}
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select Dropdown</option>
                  <option value="radio">Radio Buttons</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                {(field.fieldType === "select" || field.fieldType === "radio") && (
                  <input
                    placeholder="Options (comma-separated)"
                    value={field.options.join(", ")}
                    onChange={(e) => updateFormField(index, "options", e.target.value.split(",").map(o => o.trim()))}
                    style={{ marginBottom: "0.5rem", width: "100%" }}
                  />
                )}
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateFormField(index, "required", e.target.checked)}
                  />
                  {" "}Required Field
                </label>
                <button
                  type="button"
                  onClick={() => removeFormField(index)}
                  style={{ background: "red", color: "white", border: "none", padding: "0.3rem 0.5rem", borderRadius: "4px" }}
                >
                  Remove Field
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addFormField}
              style={{ background: "#2196F3", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px" }}
            >
              + Add Form Field
            </button>
          </div>
        )}

        {formData.eventType === "merchandise" && (
          <div style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "8px" }}>
            <h3>Merchandise Details</h3>
            <input
              name="sizes"
              placeholder="Available Sizes (comma-separated, e.g., S, M, L, XL)"
              value={merchandiseDetails.sizes}
              onChange={handleMerchandiseChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
            <input
              name="colors"
              placeholder="Available Colors (comma-separated, e.g., Red, Blue, Black)"
              value={merchandiseDetails.colors}
              onChange={handleMerchandiseChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
            <input
              name="variants"
              placeholder="Variants (comma-separated, e.g., Regular, Premium)"
              value={merchandiseDetails.variants}
              onChange={handleMerchandiseChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
            <input
              type="number"
              name="stockQuantity"
              placeholder="Stock Quantity"
              min="0"
              value={merchandiseDetails.stockQuantity}
              onChange={handleMerchandiseChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
            <input
              type="number"
              name="purchaseLimitPerParticipant"
              placeholder="Purchase Limit Per Participant"
              min="1"
              value={merchandiseDetails.purchaseLimitPerParticipant}
              onChange={handleMerchandiseChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
          </div>
        )}

        <select name="status" onChange={handleChange}>
          <option value="draft">Draft</option>
          <option value="published">Publish Now</option>
        </select>

        <button
          type="submit"
          style={{
            background: "#4CAF50",
            color: "white",
            padding: "0.75rem",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          Create Event
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
