import { useContext } from "react";
import { PreferencesContext } from "./preferencesStore";

// Questo hook ci permette di utilizzare
// le preferenze dell'utente nei componenti React.
export function usePreferences() {
  const context = useContext(PreferencesContext);

  // Se il componente non è dentro il provider,
  // mostriamo un errore per capire subito il problema.
  if (!context) {
    throw new Error(
      "usePreferences deve essere utilizzato dentro PreferencesProvider",
    );
  }

  return context;
}
