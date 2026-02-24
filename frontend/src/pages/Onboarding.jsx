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
          fetch(`${import.meta.env.VITE_API_URL}/api/preferences/interests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/preferences/organizers`, {
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
        `${import.meta.env.VITE_API_URL}/api/preferences/update`,
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/preferences/skip`, {
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
        <h2 style={{ color: "#10b981" }}>Setup Complete!</h2>
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
    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a78bfa 100%)",
    padding: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "2.5rem",
    maxWidth: "700px",
    width: "100%",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
  },
  error: {
    background: "#fef2f2",
    color: "#ef4444",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1.5rem",
    border: "1px solid #fecaca",
    fontWeight: "500",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#64748b",
    marginBottom: "2rem",
  },
  section: {
    marginBottom: "2.5rem",
  },
  sectionDesc: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    marginBottom: "1rem",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "0.8rem",
  },
  interestButton: {
    padding: "0.75rem 1rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.15s",
  },
  interestButtonSelected: {
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    borderColor: "#6366f1",
    boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
  },
  organizersContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  organizerItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem 1rem",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  checkbox: {
    marginRight: "1rem",
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#6366f1",
  },
  organizerLabel: {
    cursor: "pointer",
    fontSize: "0.95rem",
    color: "#1e293b",
  },
  noData: {
    color: "#94a3b8",
    fontStyle: "italic",
    padding: "1.5rem",
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  actionButtons: {
    display: "flex",
    gap: "1rem",
    marginTop: "2rem",
    marginBottom: "1rem",
  },
  saveButton: {
    flex: 1,
    padding: "0.8rem 1.5rem",
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
  },
  skipButton: {
    flex: 1,
    padding: "0.8rem 1.5rem",
    background: "#fff",
    color: "#6366f1",
    border: "1.5px solid #6366f1",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  note: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    textAlign: "center",
  },
};

export default Onboarding;
