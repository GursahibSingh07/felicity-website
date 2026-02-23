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
    <nav style={{ 
      padding: "1rem", 
      borderBottom: "1px solid #ddd",
      background: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      gap: "1rem"
    }}>
      <Link to="/" style={{ fontWeight: "bold", color: "#333", textDecoration: "none" }}>
        Event Management
      </Link>

      {user?.role === "participant" && (
        <>
          <Link to="/participant/dashboard" style={{ textDecoration: "none", color: "#007bff" }}>
            Dashboard
          </Link>
          <Link to="/events" style={{ textDecoration: "none", color: "#007bff" }}>
            Browse Events
          </Link>
          <Link to="/clubs" style={{ textDecoration: "none", color: "#007bff" }}>
            Clubs/Organizers
          </Link>
        </>
      )}

      {user?.role === "organizer" && (
        <>
          <Link to="/organizer/dashboard" style={{ textDecoration: "none", color: "#007bff" }}>
            Dashboard
          </Link>
          <Link to="/organizer/create" style={{ textDecoration: "none", color: "#007bff" }}>
            Create Event
          </Link>
          <Link to="/organizer/ongoing" style={{ textDecoration: "none", color: "#007bff" }}>
            Ongoing Events
          </Link>
        </>
      )}

      {user?.role === "admin" && (
        <>
          <Link to="/admin/dashboard" style={{ textDecoration: "none", color: "#007bff" }}>
            Dashboard
          </Link>
          <Link to="/admin/organizers" style={{ textDecoration: "none", color: "#007bff" }}>
            Manage Clubs/Organizers
          </Link>
        </>
      )}

      <div style={{ marginLeft: "auto", display: "flex", gap: "1rem" }}>
        <Link to="/profile" style={{ textDecoration: "none", color: "#007bff" }}>
          Profile
        </Link>
        <button
          onClick={handleLogout}
          style={{ 
            background: "#dc3545", 
            color: "white", 
            border: "none", 
            padding: "0.4rem 1rem", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
