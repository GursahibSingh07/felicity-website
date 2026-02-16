import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userType = localStorage.getItem("userType");
    const isRoleLocked = localStorage.getItem("isRoleLocked") === "true";
    const userId = localStorage.getItem("userId");
    
    return token && role 
      ? { token, role, userType, isRoleLocked, userId } 
      : null;
  });

  const login = (token, role, userType = "participant", isRoleLocked = false, userId = null) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userType", userType);
    localStorage.setItem("isRoleLocked", isRoleLocked.toString());
    localStorage.setItem("userId", userId);
    setUser({ token, role, userType, isRoleLocked, userId });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
