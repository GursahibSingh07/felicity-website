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

  if (loading) return <h2 style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading organizers...</h2>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Clubs & Organizers</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Browse and follow your favorite event organizers
      </p>

      {error && <p style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem" }}>{error}</p>}
      {message && (
        <div style={{
          padding: "1rem",
          background: message.includes("success") ? "#d1fae5" : "#fef2f2",
          color: message.includes("success") ? "#065f46" : "#991b1b",
          borderRadius: "10px",
          marginBottom: "1rem",
          fontWeight: "500"
        }}>
          {message}
        </div>
      )}

      {organizers.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          background: "white",
          borderRadius: "16px",
          border: "1px solid #e2e8f0"
        }}>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
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
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s"
                }}
              >
                <Link
                  to={`/clubs/${organizer._id}`}
                  style={{
                    textDecoration: "none",
                    color: "#6366f1",
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.01em"
                  }}
                >
                  {organizer.organizerName || "Unnamed Organizer"}
                </Link>

                <span style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  background: "#ede9fe",
                  color: "#7c3aed",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  width: "fit-content"
                }}>
                  {organizer.category || "General"}
                </span>

                <p style={{
                  color: "#64748b",
                  fontSize: "0.93rem",
                  marginBottom: "1rem",
                  flexGrow: 1,
                  lineHeight: "1.6"
                }}>
                  {organizer.description || "No description available"}
                </p>

                <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
                  📧 {organizer.email}
                </p>

                <button
                  onClick={() => isFollowing ? handleUnfollow(organizer._id) : handleFollow(organizer._id)}
                  style={{
                    width: "100%",
                    padding: "0.7rem",
                    background: isFollowing ? "#f1f5f9" : "linear-gradient(135deg, #6366f1, #818cf8)",
                    color: isFollowing ? "#475569" : "white",
                    border: isFollowing ? "1.5px solid #e2e8f0" : "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    transition: "all 0.15s"
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
