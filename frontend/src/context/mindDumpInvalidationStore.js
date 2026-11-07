import { createContext, useContext } from "react";

export const MindDumpInvalidationContext = createContext(null);

export function useMindDumpInvalidation() {
  const context = useContext(MindDumpInvalidationContext);

  if (!context) {
    throw new Error("useMindDumpInvalidation richiede MindDumpInvalidationProvider");
  }

  return context;
}
