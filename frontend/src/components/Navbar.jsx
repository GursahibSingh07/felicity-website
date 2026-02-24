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
      padding: "0.75rem 1.5rem", 
      borderBottom: "1px solid rgba(99,102,241,0.08)",
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 1px 8px rgba(99,102,241,0.06)",
    }}>
      <Link to="/" style={{ 
        fontWeight: "700", 
        color: "#6366f1", 
        textDecoration: "none",
        fontSize: "1.1rem",
        marginRight: "1.5rem",
        letterSpacing: "-0.02em",
      }}>
        Event Management
      </Link>

      {user?.role === "participant" && (
        <>
          <Link to="/participant/dashboard" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500", transition: "all 0.15s" }}>
            Dashboard
          </Link>
          <Link to="/events" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500", transition: "all 0.15s" }}>
            Browse Events
          </Link>
          <Link to="/clubs" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500", transition: "all 0.15s" }}>
            Clubs/Organizers
          </Link>
        </>
      )}

      {user?.role === "organizer" && (
        <>
          <Link to="/organizer/dashboard" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500" }}>
            Dashboard
          </Link>
          <Link to="/organizer/create" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500" }}>
            Create Event
          </Link>
          <Link to="/organizer/ongoing" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500" }}>
            Ongoing Events
          </Link>
        </>
      )}

      {user?.role === "admin" && (
        <>
          <Link to="/admin/dashboard" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500" }}>
            Dashboard
          </Link>
          <Link to="/admin/organizers" style={{ textDecoration: "none", color: "#475569", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "500" }}>
            Manage Clubs/Organizers
          </Link>
        </>
      )}

      <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Link to="/profile" style={{ 
          textDecoration: "none", 
          color: "#6366f1",
          padding: "0.4rem 0.75rem",
          borderRadius: "8px",
          fontSize: "0.9rem",
          fontWeight: "600",
        }}>
          Profile
        </Link>
        <button
          onClick={handleLogout}
          style={{ 
            background: "linear-gradient(135deg, #ef4444, #f87171)", 
            color: "white", 
            border: "none", 
            padding: "0.4rem 1rem", 
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "600",
            boxShadow: "0 2px 8px rgba(239,68,68,0.25)",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
