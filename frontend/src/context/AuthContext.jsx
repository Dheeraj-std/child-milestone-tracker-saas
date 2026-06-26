import { createContext, useContext, useState, useEffect } from "react";
import { login, logout, signup, getMe } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await getMe();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        // No valid token/session, fail silently and keep user as null
        console.log("No active session detected.");
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const credentials = typeof email === "object" ? email : { email, password };
      const data = await login(credentials);
      if (data.success && data.user) {
        setUser(data.user);
      }
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signupUser = async (userData) => {
    setLoading(true);
    try {
      const data = await signup(userData);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        signupUser,
        logoutUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
