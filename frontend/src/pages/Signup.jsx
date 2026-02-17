import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function Signup() {
  const { user, login } = useAuth();   
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("iiit-participant");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [collegeOrgName, setCollegeOrgName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === "participant") {
        navigate("/onboarding");
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!firstName || !lastName || !collegeOrgName || !contactNumber) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      setError("Contact number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    if (userType === "iiit-participant" && !email.endsWith("@iiit.ac.in")) {
      setError("IIIT participants must use @iiit.ac.in email address");
      setLoading(false);
      return;
    }

    if (userType === "non-iiit-participant" && email.endsWith("@iiit.ac.in")) {
      setError("IIIT email addresses must register as IIIT participant");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          userType,
          firstName,
          lastName,
          collegeOrgName,
          contactNumber
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      login(
        data.token,
        data.user.role,
        data.user.email,
        data.user.userType,
        data.user.isRoleLocked,
        data.user.id,
        data.user.preferencesComplete || false
      );
    } 
    
    catch (err) {
      setError(err.message);
    } 
    
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign up</h2>

        {/* Participant Type Selection */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
            I am a:
          </label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
            required
          >
            <option value="iiit-participant">IIIT Student</option>
            <option value="non-iiit-participant">Non-IIIT Participant</option>
          </select>
          <small style={{ color: "#666", display: "block", marginTop: "0.25rem" }}>
            {userType === "iiit-participant"
              ? "Use your @iiit.ac.in email address"
              : "Non-IIIT participants can use any email"}
          </small>
        </div>

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="College / Organization Name"
          value={collegeOrgName}
          onChange={(e) => setCollegeOrgName(e.target.value)}
          required
        />

        <input
          type="tel"
          placeholder="Contact Number (10 digits)"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          required
          pattern="\d{10}"
          maxLength="10"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="6"
        />

        <button disabled={loading}>
          {loading ? "Signing up..." : "Sign up"}
        </button>

        {error && <p className="error">{error}</p>}

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;

