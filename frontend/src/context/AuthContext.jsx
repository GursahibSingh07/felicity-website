import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const userType = localStorage.getItem("userType");
    const isRoleLocked = localStorage.getItem("isRoleLocked") === "true";
    const userId = localStorage.getItem("userId");
    const preferencesComplete = localStorage.getItem("preferencesComplete") === "true";
    
    return token && role 
      ? { token, role, email, userType, isRoleLocked, userId, preferencesComplete } 
      : null;
  });

  const login = (token, role, email, userType = "participant", isRoleLocked = false, userId = null, preferencesComplete = false) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);
    localStorage.setItem("userType", userType);
    localStorage.setItem("isRoleLocked", isRoleLocked.toString());
    localStorage.setItem("userId", userId);
    localStorage.setItem("preferencesComplete", preferencesComplete.toString());
    setUser({ token, role, email, userType, isRoleLocked, userId, preferencesComplete });
  };

  const updatePreferencesComplete = () => {
    localStorage.setItem("preferencesComplete", "true");
    setUser(prev => prev ? { ...prev, preferencesComplete: true } : null);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  useEffect(() => {
    const verifyStoredToken = async () => {
      if (!user?.token) {
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!res.ok) {
          logout();
        }
      } catch {
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    verifyStoredToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePreferencesComplete, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
