import { useContext } from "react";
import { AuthContext } from "./authStore";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve essere utilizzato dentro AuthProvider");
  }

  return context;
}
