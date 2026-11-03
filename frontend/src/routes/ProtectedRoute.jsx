import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, user, token, restoreError, retrySession, logout } = useAuth();
  const location = useLocation();

  if (isLoading || restoreError) {
    return (
      <main className="welcome-page">
        <div className="welcome-page__content">
          {isLoading ? (
            <p role="status">Prepariamo il tuo spazio...</p>
          ) : (
            <>
              <p role="alert">{restoreError}</p>
              <button type="button" className="welcome-page__primary" onClick={retrySession}>
                Riprova
              </button>
            </>
          )}
          {token && (
            <button type="button" className="welcome-page__secondary" onClick={logout}>
              Esci
            </button>
          )}
        </div>
      </main>
    );
  }

  // Utente non autenticato
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Utente autenticato
  return <Outlet key={user.id} />;
}
