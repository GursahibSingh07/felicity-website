import { useState } from "react";
import "../styles/auth.css";
import { Link } from "react-router-dom";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log(data);
  };

   return (
    <div className="auth-container">
        <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
        />

        <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

        <p className="auth-switch">
            Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
        </form>
    </div>
    );
}

export default Login;
