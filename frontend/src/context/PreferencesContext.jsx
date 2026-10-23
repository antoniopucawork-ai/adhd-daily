import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiRequest } from "../services/api";
import { DEFAULT_HOME_MODULES } from "../config/homeModules";
import { PreferencesContext } from "./preferencesStore";

// Qui gestiamo le preferenze dell'utente.
// Le recuperiamo dal backend e le condividiamo con il resto dell'app.

export function PreferencesProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  // Teniamo insieme i dati e il token a cui appartengono.
  // Così non mostriamo le preferenze di un altro account.
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Senza autenticazione non dobbiamo fare richieste.
    if (!isAuthenticated || !token) {
      return;
    }

    let cancelled = false;

    // Recuperiamo le preferenze salvate su MongoDB.
    async function loadPreferences() {
      try {
        const data = await apiRequest("/api/auth/preferences", {
          token,
        });

        if (!cancelled) {
          setResult({
            token,
            preferences: data,
            error: "",
          });
        }
      } catch {
        if (!cancelled) {
          setResult({
            token,
            preferences: null,
            error: "Non siamo riusciti a caricare le preferenze.",
          });
        }
      }
    }

    loadPreferences();

    // Ignoriamo la risposta se il componente viene smontato
    // oppure cambia la sessione.
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  // Usiamo i dati soltanto se appartengono alla sessione attuale.
  const currentResult =
    isAuthenticated && token && result?.token === token ? result : null;

  const preferences = currentResult?.preferences ?? null;
  const error = currentResult?.error ?? "";

  // Aspettiamo la risposta del backend prima di mostrare la Home.
  const isLoading = Boolean(isAuthenticated && token && !currentResult);

  // La configurazione iniziale serve come valore di riferimento.
  // Se il caricamento fallisce, mostreremo l'errore nella Home.
  const homeModules = preferences?.homeModules ?? DEFAULT_HOME_MODULES;

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        homeModules,
        isLoading,
        error,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
