import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function Login() {
  const { user, login, authLoading } = useAuth();  
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      if (user.role === "participant" && user.preferencesComplete === false) {
        navigate("/onboarding");
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [user, navigate, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
        data.user.preferencesComplete
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
        <h2>Sign in</h2>
        <p className="auth-sub">Welcome back — let's get you in.</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {error && <p className="error">{error}</p>}

        <p>
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
