import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiRequest } from "../services/api";
import { DEFAULT_HOME_MODULES } from "../config/homeModules";
import { PreferencesContext } from "./preferencesStore";

export function PreferencesProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let cancelled = false;

    async function loadPreferences() {
      try {
        const data = await apiRequest("/api/auth/preferences", {
          token,
        });

        if (!cancelled) {
          setResult({ token, preferences: data, error: "" });
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

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  // Utilizziamo soltanto i dati della sessione corrente.
  const currentResult =
    isAuthenticated && result?.token === token ? result : null;

  const preferences = currentResult?.preferences ?? null;
  const homeModules = preferences?.homeModules ?? DEFAULT_HOME_MODULES;

  async function saveHomeModules(modules) {
    if (!token || !preferences) {
      throw new Error("Preferenze non disponibili.");
    }

    const response = await apiRequest("/api/auth/preferences", {
      method: "PATCH",
      token,
      body: JSON.stringify({
        onboardingCompleted: preferences.onboardingCompleted ?? false,
        homeModules: modules,
      }),
    });

    if (!Array.isArray(response?.preferences?.homeModules)) {
      throw new Error("Salvataggio non confermato.");
    }

    // Aggiorniamo la Home senza dover ricaricare la pagina.
    setResult((previous) =>
      previous?.token === token
        ? {
            token,
            preferences: response.preferences,
            error: "",
          }
        : previous,
    );

    return response.preferences.homeModules;
  }

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        homeModules,
        saveHomeModules,
        isLoading: Boolean(isAuthenticated && token && !currentResult),
        error: currentResult?.error ?? "",
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
