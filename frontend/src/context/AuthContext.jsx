import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { AuthContext } from "./authStore";

const TOKEN_KEY = "adhdDailyToken";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Verifica la sessione quando l'app viene avviata
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const savedToken = sessionStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await apiRequest("/api/auth/me", {
          token: savedToken,
        });

        if (!cancelled) {
          setUser(currentUser);
          setToken(savedToken);
        }
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    sessionStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setToken(data.token);

    return data;
  };

  const register = async (firstName, email, password) => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, email, password }),
    });
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
