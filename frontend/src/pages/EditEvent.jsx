import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `http://localhost:5000/api/events/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

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

        if (data.customForm) {
          setCustomForm(data.customForm);
        }

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

      if (formData.eventType === "normal") {
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

      const res = await fetch(
        `http://localhost:5000/api/events/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      navigate("/organizer/dashboard");

    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading...</h2>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Edit Event</h1>

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
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Event Description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="4"
        />

        <select name="eventType" value={formData.eventType} onChange={handleChange}>
          <option value="normal">Normal Event (Individual Registration)</option>
          <option value="merchandise">Merchandise Event (Individual Purchase)</option>
        </select>

        <label>Event Start Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <label>Event End Date</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          required
        />

        <label>Registration Deadline</label>
        <input
          type="date"
          name="registrationDeadline"
          value={formData.registrationDeadline}
          onChange={handleChange}
          required
        />

        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          required
        />

        <input
          name="eligibility"
          placeholder="Eligibility"
          value={formData.eligibility}
          onChange={handleChange}
        />

        <input
          type="number"
          name="capacity"
          placeholder="Registration Limit"
          value={formData.capacity}
          onChange={handleChange}
          min="1"
          required
        />

        <input
          type="number"
          name="registrationFee"
          placeholder="Registration Fee"
          value={formData.registrationFee}
          onChange={handleChange}
          min="0"
        />

        <input
          name="tags"
          placeholder="Event Tags (comma-separated)"
          value={formData.tags}
          onChange={handleChange}
        />

        {formData.eventType === "normal" && (
          <div style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "8px" }}>
            <h3>Custom Registration Form</h3>

            {customForm.map((field, index) => (
              <div key={index} style={{ marginBottom: "1rem", padding: "1rem", background: "#f9f9f9", borderRadius: "4px" }}>
                <input
                  placeholder="Field Name"
                  value={field.fieldName}
                  onChange={(e) => updateFormField(index, "fieldName", e.target.value)}
                  style={{ marginBottom: "0.5rem", width: "100%" }}
                />
                <input
                  placeholder="Field Label"
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
                    value={Array.isArray(field.options) ? field.options.join(", ") : ""}
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
              placeholder="Available Sizes (comma-separated)"
              value={merchandiseDetails.sizes}
              onChange={handleMerchandiseChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
            <input
              name="colors"
              placeholder="Available Colors (comma-separated)"
              value={merchandiseDetails.colors}
              onChange={handleMerchandiseChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
            <input
              name="variants"
              placeholder="Variants (comma-separated)"
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

        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
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
          Update Event
        </button>
      </form>
    </div>
  );
}

export default EditEvent;
