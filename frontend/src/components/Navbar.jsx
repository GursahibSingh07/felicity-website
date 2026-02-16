import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  if (!user) return null;

  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
      <Link to="/">Home</Link>

      {user?.role === "participant" && (
        <Link to="/events" style={{ marginLeft: "1rem" }}>
          Browse Events
        </Link>
      )}

      {user && (
        <button
          onClick={logout}
          style={{ marginLeft: "1rem" }}
        >
          Logout
        </button>
      )}
    </nav>
  );
}

export default Navbar;
