import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === "participant" ? "preferences" : "account");
  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [preferences, setPreferences] = useState({
    areasOfInterest: [],
    followedOrganizers: [],
  });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [editedProfile, setEditedProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await profileRes.json();
        setProfileData(profileData);
        setEditedProfile(profileData);

        if (user?.role === "participant") {
          const [interestsRes, organizersRes, prefsRes] = await Promise.all([
            fetch("http://localhost:5000/api/preferences/interests", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/preferences/organizers", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/preferences", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (!interestsRes.ok || !organizersRes.ok || !prefsRes.ok) {
            throw new Error("Failed to fetch preferences data");
          }

          const interestsData = await interestsRes.json();
          const organizersData = await organizersRes.json();
          const prefsData = await prefsRes.json();

          setInterests(interestsData.interests || []);
          setOrganizers(organizersData.organizers || []);
          setPreferences(prefsData);
          setSelectedInterests(prefsData.areasOfInterest || []);
          const orgIds = (prefsData.followedOrganizers || []).map((org) => {
            return typeof org === "string" ? org : org._id;
          });
          setSelectedOrganizers(orgIds);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    setSuccess("");

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

      const data = await res.json();
      setPreferences(data.preferences);
      setSuccess("Preferences saved successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    if (profileData?.role === "participant" && editedProfile.contactNumber) {
      if (!/^\d{10}$/.test(editedProfile.contactNumber)) {
        setError("Contact number must be exactly 10 digits");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedProfile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update profile");
      }

      const data = await res.json();
      setProfileData(data.user);
      setEditedProfile(data.user);
      setSuccess("Profile updated successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1>Profile</h1>
          <p style={styles.email}>{user?.email}</p>
        </div>

        <div style={styles.tabsContainer}>
          {user?.role === "participant" && (
            <button
              onClick={() => setActiveTab("preferences")}
              style={{
                ...styles.tab,
                ...(activeTab === "preferences" ? styles.tabActive : {}),
              }}
            >
              Preferences
            </button>
          )}
          <button
            onClick={() => setActiveTab("account")}
            style={{
              ...styles.tab,
              ...(activeTab === "account" ? styles.tabActive : {}),
            }}
          >
            Account
          </button>
        </div>

        {activeTab === "preferences" && user?.role === "participant" && (
          <div style={styles.tabContent}>
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

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
              <h2>Follow Organizers</h2>
              <p style={styles.sectionDesc}>
                Follow organizers to stay updated with their events
              </p>
              {organizers.length === 0 ? (
                <p style={styles.noData}>
                  No organizers available to follow.
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

            <button
              onClick={handleSavePreferences}
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.buttonDisabled : {}),
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {activeTab === "account" && (
          <div style={styles.tabContent}>
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <div style={styles.section}>
              <h3>Account Information</h3>
              
              <div style={styles.infoRow}>
                <label>Email:</label>
                <span>{profileData?.email}</span>
              </div>
              
              <div style={styles.infoRow}>
                <label>Role:</label>
                <span style={{ textTransform: "capitalize" }}>
                  {profileData?.role}
                </span>
              </div>

              {profileData?.role === "participant" && (
                <>
                  <div style={styles.editRow}>
                    <label>First Name:</label>
                    <input
                      type="text"
                      value={editedProfile.firstName || ""}
                      onChange={(e) => handleProfileChange("firstName", e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label>Last Name:</label>
                    <input
                      type="text"
                      value={editedProfile.lastName || ""}
                      onChange={(e) => handleProfileChange("lastName", e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label>College / Org Name:</label>
                    <input
                      type="text"
                      value={editedProfile.collegeOrgName || ""}
                      onChange={(e) => handleProfileChange("collegeOrgName", e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label>Contact Number:</label>
                    <input
                      type="tel"
                      value={editedProfile.contactNumber || ""}
                      onChange={(e) => handleProfileChange("contactNumber", e.target.value)}
                      style={styles.input}
                      pattern="\d{10}"
                      maxLength="10"
                      placeholder="10 digits"
                    />
                  </div>
                </>
              )}

              {profileData?.role === "organizer" && (
                <>
                  <div style={styles.editRow}>
                    <label>Organizer Name:</label>
                    <input
                      type="text"
                      value={editedProfile.organizerName || ""}
                      onChange={(e) => handleProfileChange("organizerName", e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label>Category:</label>
                    <input
                      type="text"
                      value={editedProfile.category || ""}
                      onChange={(e) => handleProfileChange("category", e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label>Description:</label>
                    <textarea
                      value={editedProfile.description || ""}
                      onChange={(e) => handleProfileChange("description", e.target.value)}
                      style={{...styles.input, minHeight: "80px", resize: "vertical"}}
                    />
                  </div>
                </>
              )}
            </div>

            {profileData?.role !== "admin" && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  ...styles.saveButton,
                  ...(saving ? styles.buttonDisabled : {}),
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}

            <div style={styles.note}>
              To change your email or password, please contact support.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "2rem",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2.5rem",
    maxWidth: "700px",
    margin: "0 auto",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },
  header: {
    marginBottom: "2rem",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "1rem",
  },
  email: {
    color: "#666",
    fontSize: "0.95rem",
    margin: "0.5rem 0 0 0",
  },
  tabsContainer: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    borderBottom: "1px solid #eee",
  },
  tab: {
    padding: "0.75rem 1.5rem",
    background: "none",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#999",
    transition: "all 0.2s",
  },
  tabActive: {
    color: "#667eea",
    borderBottomColor: "#667eea",
  },
  tabContent: {
    animation: "fadeIn 0.3s ease-in",
  },
  error: {
    background: "#fee",
    color: "#c33",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1.5rem",
    border: "1px solid #fcc",
  },
  success: {
    background: "#efe",
    color: "#3c3",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1.5rem",
    border: "1px solid #cfc",
  },
  section: {
    marginBottom: "2rem",
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
  infoRow: {
    display: "flex",
    marginBottom: "1rem",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid #eee",
  },
  editRow: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "1.25rem",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
    fontFamily: "inherit",
  },
  saveButton: {
    width: "100%",
    padding: "0.75rem 1.5rem",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
    marginTop: "1rem",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  note: {
    background: "#f0f0f0",
    padding: "1rem",
    borderRadius: "8px",
    color: "#666",
    fontSize: "0.9rem",
    marginTop: "2rem",
  },
};

export default Profile;
