import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ClubsOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchOrganizers();
    fetchFollowedOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setOrganizers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer/followed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setFollowedOrganizers(data.map(org => org._id));
      }
    } catch (err) {
      console.error("Error fetching followed organizers:", err);
    }
  };

  const handleFollow = async (organizerId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/organizer/${organizerId}/follow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFollowedOrganizers([...followedOrganizers, organizerId]);
      setMessage("Organizer followed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/organizer/${organizerId}/follow`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFollowedOrganizers(followedOrganizers.filter(id => id !== organizerId));
      setMessage("Organizer unfollowed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <h2 style={{ padding: "2rem" }}>Loading organizers...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Clubs & Organizers</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Browse and follow your favorite event organizers
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
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

      {organizers.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          background: "#f9f9f9",
          borderRadius: "8px"
        }}>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>
            No organizers found
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem"
        }}>
          {organizers.map((organizer) => {
            const isFollowing = followedOrganizers.includes(organizer._id);

            return (
              <div
                key={organizer._id}
                style={{
                  padding: "1.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <Link
                  to={`/clubs/${organizer._id}`}
                  style={{
                    textDecoration: "none",
                    color: "#007bff",
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem"
                  }}
                >
                  {organizer.organizerName || "Unnamed Organizer"}
                </Link>

                <span style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  background: "#e3f2fd",
                  color: "#1976d2",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  width: "fit-content"
                }}>
                  {organizer.category || "General"}
                </span>

                <p style={{
                  color: "#666",
                  fontSize: "0.95rem",
                  marginBottom: "1rem",
                  flexGrow: 1
                }}>
                  {organizer.description || "No description available"}
                </p>

                <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1rem" }}>
                  📧 {organizer.email}
                </p>

                <button
                  onClick={() => isFollowing ? handleUnfollow(organizer._id) : handleFollow(organizer._id)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: isFollowing ? "#6c757d" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  {isFollowing ? "✓ Following" : "+ Follow"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClubsOrganizers;
