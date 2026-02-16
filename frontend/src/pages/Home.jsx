import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      if (user.role === "participant" && user.preferencesComplete === false) {
        navigate("/onboarding");
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [user, navigate]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Redirecting...</h2>
    </div>
  );
}

export default Home;
