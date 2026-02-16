import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Onboarding() {
  const { user, updatePreferencesComplete } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [interestsRes, organizersRes] = await Promise.all([
          fetch("http://localhost:5000/api/preferences/interests", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/preferences/organizers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!interestsRes.ok || !organizersRes.ok) {
          throw new Error("Failed to fetch onboarding data");
        }

        const interestsData = await interestsRes.json();
        const organizersData = await organizersRes.json();

        setInterests(interestsData.interests || []);
        setOrganizers(organizersData.organizers || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "participant") {
      fetchData();
    }
  }, [token, user]);

  const handleInterestToggle = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleOrganizerToggle = (organizerId) => {
    setSelectedOrganizers((prev) =>
      prev.includes(organizerId)
        ? prev.filter((id) => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const handleSavePreferences = async () => {
    if (selectedInterests.length === 0 && selectedOrganizers.length === 0) {
      setError("Please select at least one interest or organizer to follow");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/preferences/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            areasOfInterest: selectedInterests,
            followedOrganizers: selectedOrganizers,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save preferences");
      }

      updatePreferencesComplete();
      setCompleted(true);
      setTimeout(() => {
        navigate("/participant/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/preferences/skip", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to skip preferences");
      }

      updatePreferencesComplete();
      setCompleted(true);
      setTimeout(() => {
        navigate("/participant/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "participant") {
    return null;
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Setup Complete!</h2>
        <p>Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Welcome to Your Event Platform</h1>
        <p style={styles.subtitle}>
          Let's personalize your experience. Tell us what interests you!
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.section}>
          <h2>Areas of Interest</h2>
          <p style={styles.sectionDesc}>
            Select your interests to get personalized event recommendations
          </p>
          <div style={styles.gridContainer}>
            {interests.map((interest) => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                style={{
                  ...styles.interestButton,
                  ...(selectedInterests.includes(interest)
                    ? styles.interestButtonSelected
                    : {}),
                }}
              >
                {selectedInterests.includes(interest) ? "✓ " : ""}
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2>Clubs / Organizers to Follow</h2>
          <p style={styles.sectionDesc}>
            Follow organizers to stay updated with their events
          </p>
          {organizers.length === 0 ? (
            <p style={styles.noData}>
              No organizers available yet. You can follow them anytime!
            </p>
          ) : (
            <div style={styles.organizersContainer}>
              {organizers.map((organizer) => (
                <div key={organizer._id} style={styles.organizerItem}>
                  <input
                    type="checkbox"
                    checked={selectedOrganizers.includes(organizer._id)}
                    onChange={() =>
                      handleOrganizerToggle(organizer._id)
                    }
                    style={styles.checkbox}
                  />
                  <label style={styles.organizerLabel}>
                    {organizer.email}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.actionButtons}>
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            style={{
              ...styles.saveButton,
              ...(saving ? styles.buttonDisabled : {}),
            }}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          <button
            onClick={handleSkip}
            disabled={saving}
            style={{
              ...styles.skipButton,
              ...(saving ? styles.buttonDisabled : {}),
            }}
          >
            Skip for Now
          </button>
        </div>

        <p style={styles.note}>
          Tip: You can always update your preferences later from your profile page.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2.5rem",
    maxWidth: "700px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  },
  error: {
    background: "#fee",
    color: "#c33",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1.5rem",
    border: "1px solid #fcc",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#666",
    marginBottom: "2rem",
  },
  section: {
    marginBottom: "2.5rem",
  },
  sectionDesc: {
    fontSize: "0.95rem",
    color: "#888",
    marginBottom: "1rem",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "0.8rem",
  },
  interestButton: {
    padding: "0.75rem 1rem",
    border: "2px solid #ddd",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  interestButtonSelected: {
    background: "#667eea",
    color: "#fff",
    borderColor: "#667eea",
  },
  organizersContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  organizerItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  checkbox: {
    marginRight: "1rem",
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  organizerLabel: {
    cursor: "pointer",
    fontSize: "0.95rem",
    color: "#333",
  },
  noData: {
    color: "#999",
    fontStyle: "italic",
    padding: "1rem",
    textAlign: "center",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  actionButtons: {
    display: "flex",
    gap: "1rem",
    marginTop: "2rem",
    marginBottom: "1rem",
  },
  saveButton: {
    flex: 1,
    padding: "0.75rem 1.5rem",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  skipButton: {
    flex: 1,
    padding: "0.75rem 1.5rem",
    background: "#fff",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  note: {
    fontSize: "0.85rem",
    color: "#999",
    textAlign: "center",
  },
};

export default Onboarding;
