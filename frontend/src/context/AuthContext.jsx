import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/api";
import { AuthContext } from "./authStore";

import { getSessionSignal, getSessionToken, replaceSession } from "../services/session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getSessionToken);
  const [isLoading, setIsLoading] = useState(true);

  const [restoreError, setRestoreError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const loginAttempt = useRef(0);

  const logout = useCallback(() => {
    replaceSession(null);
    setUser(null);
    setToken(null);
    setRestoreError("");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    window.addEventListener("adhd:session-expired", logout);
    return () => window.removeEventListener("adhd:session-expired", logout);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    const signal = getSessionSignal();

    async function restoreSession() {
      const savedToken = getSessionToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await apiRequest("/api/auth/me", { token: savedToken });
        if (!cancelled && !signal.aborted) {
          setUser(currentUser);
          setToken(savedToken);
        }
      } catch {
        // Il client API ha già invalidato la sessione in caso di 401.
        if (!cancelled && !signal.aborted) {
          setRestoreError("Non riesco a verificare la sessione. Riprova tra poco.");
        }
      } finally {
        if (!cancelled && !signal.aborted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, [attempt]);

  function retrySession() {
    setRestoreError("");
    setIsLoading(true);
    setAttempt((previous) => previous + 1);
  }

  const login = async (email, password) => {
    const signal = getSessionSignal();
    const request = ++loginAttempt.current;
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      signal,
      body: JSON.stringify({ email, password }),
    });

    signal.throwIfAborted();
    if (request !== loginAttempt.current) {
      throw new DOMException("Accesso superato", "AbortError");
    }
    replaceSession(data.token);
    setUser(data.user);
    setToken(data.token);
    setRestoreError("");
    setIsLoading(false);
    return data;
  };

  const register = async (firstName, email, password) => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, email, password }),
    });
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
        restoreError,
        retrySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
