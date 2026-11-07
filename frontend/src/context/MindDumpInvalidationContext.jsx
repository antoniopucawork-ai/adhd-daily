import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { MindDumpInvalidationContext } from "./mindDumpInvalidationStore";
import { getSessionSignal, getSessionToken } from "../services/session";

export function MindDumpInvalidationProvider({ children }) {
  const { token } = useAuth();
  const [revision, setRevision] = useState(0);
  const sessionSignal = getSessionSignal();

  // La callback sopravvive alla pagina, ma non alla sessione che l'ha creata.
  const reload = useCallback(() => {
    if (sessionSignal.aborted || token !== getSessionToken()) return;
    setRevision((current) => current + 1);
  }, [sessionSignal, token]);

  useEffect(() => {
    function handleCreated(event) {
      if (event.detail?.token === token && event.detail?.sessionSignal === sessionSignal) {
        reload();
      }
    }

    window.addEventListener("adhd:mind-dump-created", handleCreated);
    return () => window.removeEventListener("adhd:mind-dump-created", handleCreated);
  }, [reload, sessionSignal, token]);

  return (
    <MindDumpInvalidationContext.Provider value={{ revision, reload }}>
      {children}
    </MindDumpInvalidationContext.Provider>
  );
}
