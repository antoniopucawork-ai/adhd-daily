import { useState } from "react";
import { apiRequest } from "../services/api";
import { AuthContext } from "./authStore";

export function AuthProvider({ children }) {
  // 1. Stato dell'utente e del token
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // 2. LOGIN
  const login = async (email, password) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    setUser(data.user);
    setToken(data.token);

    return data;
  };

  // 3. REGISTRAZIONE
  const register = async (firstName, email, password) => {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName,
        email,
        password,
      }),
    });

    return data;
  };

  // 4. LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  // 5. Controllo autenticazione
  const isAuthenticated = Boolean(user && token);

  // 6. Condivisione delle informazioni
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
