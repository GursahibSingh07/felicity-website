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
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [resetReason, setResetReason] = useState("");
  const [resetRequests, setResetRequests] = useState([]);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
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
            fetch(`${import.meta.env.VITE_API_URL}/api/preferences/interests`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${import.meta.env.VITE_API_URL}/api/preferences/organizers`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${import.meta.env.VITE_API_URL}/api/preferences`, {
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

  useEffect(() => {
    if (user?.role === "organizer") {
      fetchResetRequests();
    }
  }, [user]);

  const fetchResetRequests = async () => {
    setResetLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/my-reset-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResetRequests(data);
      }
    } catch {} finally {
      setResetLoading(false);
    }
  };

  const handleSubmitResetRequest = async () => {
    if (!resetReason.trim()) {
      setError("Please provide a reason for the password reset request");
      return;
    }
    setResetSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: resetReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setResetReason("");
      fetchResetRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResetSubmitting(false);
    }
  };

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
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

  const handlePasswordChange = async () => {
    setError("");
    setSuccess("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
          {user?.role !== "admin" && (
            <button
              onClick={() => setActiveTab("security")}
              style={{
                ...styles.tab,
                ...(activeTab === "security" ? styles.tabActive : {}),
              }}
            >
              Security
            </button>
          )}
          {user?.role === "organizer" && (
            <button
              onClick={() => setActiveTab("resetRequest")}
              style={{
                ...styles.tab,
                ...(activeTab === "resetRequest" ? styles.tabActive : {}),
              }}
            >
              Password Reset
            </button>
          )}
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

                  <div style={styles.editRow}>
                    <label>Contact Email (public):</label>
                    <input
                      type="email"
                      value={editedProfile.contactEmail || ""}
                      onChange={(e) => handleProfileChange("contactEmail", e.target.value)}
                      style={styles.input}
                      placeholder="Public contact email shown to participants"
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label>Discord Webhook URL:</label>
                    <input
                      type="url"
                      value={editedProfile.discordWebhook || ""}
                      onChange={(e) => handleProfileChange("discordWebhook", e.target.value)}
                      style={styles.input}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.35rem" }}>
                      When set, new published events will be announced to your Discord channel automatically.
                    </span>
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

        {activeTab === "security" && (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <h3>Change Password</h3>
              <p style={styles.sectionDesc}>
                Update your password to keep your account secure.
              </p>

              <div style={styles.editRow}>
                <label>Current Password:</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  style={styles.input}
                  placeholder="Enter current password"
                />
              </div>

              <div style={styles.editRow}>
                <label>New Password:</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  style={styles.input}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div style={styles.editRow}>
                <label>Confirm New Password:</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  style={styles.input}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.buttonDisabled : {}),
              }}
            >
              {saving ? "Changing..." : "Change Password"}
            </button>
          </div>
        )}

        {activeTab === "resetRequest" && user?.role === "organizer" && (
          <div style={styles.tabContent}>
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <div style={styles.section}>
              <h3>Request Password Reset from Admin</h3>
              <p style={styles.sectionDesc}>
                If you need your password reset, submit a request to the admin. You will receive a new auto-generated password once approved.
              </p>

              <div style={styles.editRow}>
                <label>Reason for Reset:</label>
                <textarea
                  value={resetReason}
                  onChange={e => setResetReason(e.target.value)}
                  style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
                  placeholder="Explain why you need a password reset"
                  maxLength={500}
                />
              </div>

              <button
                onClick={handleSubmitResetRequest}
                disabled={resetSubmitting || !resetReason.trim()}
                style={{
                  ...styles.saveButton,
                  background: resetSubmitting || !resetReason.trim() ? "#cbd5e1" : "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  cursor: resetSubmitting || !resetReason.trim() ? "not-allowed" : "pointer",
                }}
              >
                {resetSubmitting ? "Submitting..." : "Submit Reset Request"}
              </button>
            </div>

            <div style={styles.section}>
              <h3>Request History</h3>
              {resetLoading ? (
                <p>Loading...</p>
              ) : resetRequests.length === 0 ? (
                <p style={styles.noData}>No password reset requests yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {resetRequests.map(req => (
                    <div key={req._id} style={{
                      padding: "1rem",
                      background: req.status === "pending" ? "#fef3c7" : req.status === "approved" ? "#ecfdf5" : "#fef2f2",
                      borderRadius: "12px",
                      border: `1.5px solid ${req.status === "pending" ? "#f59e0b" : req.status === "approved" ? "#10b981" : "#ef4444"}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          color: "white",
                          background: req.status === "pending" ? "#f59e0b" : req.status === "approved" ? "#10b981" : "#ef4444",
                        }}>
                          {req.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}><strong>Reason:</strong> {req.reason}</p>
                      {req.adminComment && <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.85rem", color: "#475569" }}><strong>Admin Comment:</strong> {req.adminComment}</p>}
                      {req.processedAt && <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>Processed: {new Date(req.processedAt).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              )}
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
    padding: "2rem",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "2.5rem",
    maxWidth: "700px",
    margin: "0 auto",
    boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
    border: "1px solid #e2e8f0",
  },
  header: {
    marginBottom: "2rem",
    borderBottom: "1.5px solid #f1f5f9",
    paddingBottom: "1rem",
  },
  email: {
    color: "#64748b",
    fontSize: "0.95rem",
    margin: "0.5rem 0 0 0",
  },
  tabsContainer: {
    display: "flex",
    gap: "0.4rem",
    marginBottom: "2rem",
    background: "#f1f5f9",
    padding: "0.35rem",
    borderRadius: "12px",
  },
  tab: {
    padding: "0.6rem 1.25rem",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#64748b",
    transition: "all 0.15s",
  },
  tabActive: {
    color: "#6366f1",
    background: "white",
    boxShadow: "0 2px 8px rgba(99,102,241,0.1)",
    fontWeight: "600",
  },
  tabContent: {
    animation: "fadeIn 0.3s ease-in",
  },
  error: {
    background: "#fef2f2",
    color: "#ef4444",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1.5rem",
    border: "1px solid #fecaca",
    fontWeight: "500",
    fontSize: "0.9rem",
  },
  success: {
    background: "#ecfdf5",
    color: "#059669",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1.5rem",
    border: "1px solid #a7f3d0",
    fontWeight: "500",
    fontSize: "0.9rem",
  },
  section: {
    marginBottom: "2rem",
  },
  sectionDesc: {
    fontSize: "0.93rem",
    color: "#94a3b8",
    marginBottom: "1rem",
    lineHeight: "1.5",
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
    fontSize: "0.9rem",
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
  infoRow: {
    display: "flex",
    marginBottom: "1rem",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid #f1f5f9",
  },
  editRow: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "1.25rem",
  },
  input: {
    padding: "0.75rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
    fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },
  saveButton: {
    width: "100%",
    padding: "0.8rem 1.5rem",
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: "1rem",
    boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  note: {
    background: "#f8fafc",
    padding: "1rem",
    borderRadius: "10px",
    color: "#64748b",
    fontSize: "0.9rem",
    marginTop: "2rem",
    border: "1px solid #e2e8f0",
  },
};

export default Profile;
