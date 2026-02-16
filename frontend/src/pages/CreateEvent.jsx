import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateEvent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    capacity: "",
    status: "draft",
    registrationDeadline : "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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
          maxWidth: "500px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <input
          name="title"
          placeholder="Title"
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        />

        <input
            type="date"
            name="date"
            onChange={handleChange}
            required
        />

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
          type="number"
          name="capacity"
          placeholder="Capacity"
          min="1"
          onChange={handleChange}
          required
        />

        <select name="status" onChange={handleChange}>
          <option value="draft">Draft</option>
          <option value="published">Publish Now</option>
        </select>

        <button
          type="submit"
          style={{
            background: "#4CAF50",
            color: "white",
            padding: "0.5rem",
            border: "none",
          }}
        >
          Create Event
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
