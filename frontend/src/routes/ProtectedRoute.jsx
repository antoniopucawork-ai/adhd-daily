import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Aspettiamo la verifica del token
  if (isLoading) {
    return <p>Prepariamo il tuo spazio...</p>;
  }

  // Utente non autenticato
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Utente autenticato
  return <Outlet />;
}
