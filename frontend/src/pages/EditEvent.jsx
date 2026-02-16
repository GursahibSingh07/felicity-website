import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    registrationDeadline: "",
    location: "",
    capacity: "",
    status: "draft",
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
          ...data,
          date: data.date?.split("T")[0],
          registrationDeadline:
            data.registrationDeadline?.split("T")[0],
        });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/events/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
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
          maxWidth: "500px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <input name="title" value={formData.title} onChange={handleChange} required />
        <textarea name="description" value={formData.description} onChange={handleChange} required />
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        <input type="date" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required />
        <input name="location" value={formData.location} onChange={handleChange} required />
        <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" required />

        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <button type="submit" style={{ background: "#4CAF50", color: "white" }}>
          Update Event
        </button>
      </form>
    </div>
  );
}

export default EditEvent;
