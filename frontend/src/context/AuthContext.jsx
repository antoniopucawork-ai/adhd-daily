import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/api";
import { AuthContext } from "./authStore";
import {
  getSessionSignal,
  getSessionToken,
  replaceSession,
} from "../services/session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getSessionToken);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreError, setRestoreError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const loginAttempt = useRef(0);

  // LOGOUT
  const logout = useCallback(() => {
    replaceSession(null);
    setUser(null);
    setToken(null);
    setRestoreError("");
    setIsLoading(false);
  }, []);

  // GESTIONE SESSIONE SCADUTA
  useEffect(() => {
    window.addEventListener("adhd:session-expired", logout);

    return () => {
      window.removeEventListener("adhd:session-expired", logout);
    };
  }, [logout]);

  // RIPRISTINO SESSIONE
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
        const currentUser = await apiRequest("/api/auth/me", {
          token: savedToken,
        });

        if (!cancelled && !signal.aborted) {
          setUser(currentUser);
          setToken(savedToken);
        }
      } catch {
        if (!cancelled && !signal.aborted) {
          setRestoreError(
            "Non riesco a verificare la sessione. Riprova tra poco.",
          );
        }
      } finally {
        if (!cancelled && !signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // RIPROVA RIPRISTINO SESSIONE
  function retrySession() {
    setRestoreError("");
    setIsLoading(true);
    setAttempt((previous) => previous + 1);
  }

  // AUTENTICAZIONE CONDIVISA
  // Utilizzata sia dal login tradizionale che da Google.
  const authenticate = async (path, body) => {
    const signal = getSessionSignal();
    const request = ++loginAttempt.current;

    const data = await apiRequest(path, {
      method: "POST",
      signal,
      body: JSON.stringify(body),
    });

    signal.throwIfAborted();

    // Impedisce a una risposta precedente
    // di sostituire una sessione più recente.
    if (request !== loginAttempt.current) {
      throw new DOMException("Accesso superato", "AbortError");
    }

    // Unico punto di aggiornamento della sessione.
    replaceSession(data.token);

    setUser(data.user);
    setToken(data.token);
    setRestoreError("");
    setIsLoading(false);

    return data;
  };

  // LOGIN TRADIZIONALE
  const login = (email, password) => {
    return authenticate("/api/auth/login", {
      email,
      password,
    });
  };

  // LOGIN GOOGLE
  const loginWithGoogle = (credential) => {
    return authenticate("/api/auth/google", {
      credential,
    });
  };

  // REGISTRAZIONE TRADIZIONALE
  const register = async (firstName, email, password) => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName,
        email,
        password,
      }),
    });
  };

  // STATO AUTENTICAZIONE
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithGoogle,
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
