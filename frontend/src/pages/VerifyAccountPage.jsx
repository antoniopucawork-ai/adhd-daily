import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import PublicAccessLayout from "./PublicAccessLayout";

function VerifyAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState(token ? "loading" : "error");
  const verificationStarted = useRef(false);

  useEffect(() => {
    // Evitiamo richieste duplicate
    // Non avviamo la verifica senza un token
    if (!token) return;

    // Evitiamo richieste duplicate
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    // Chiediamo al backend di verificare l'account
    async function verifyAccount() {
      try {
        await apiRequest("/api/auth/verify-account", {
          method: "POST",
          body: JSON.stringify({ token }),
        });

        setStatus("success");
      } catch {
        setStatus("error");
      }
    }

    verifyAccount();
  }, [token]);

  return (
    <PublicAccessLayout
      variant="register"
      eyebrow="Il tuo spazio personale"
      title="Verifica dell'account."
      description="Completiamo l'attivazione della tua email."
    >
      <section className="access-page__panel">
        {status === "loading" && (
          <p role="status">Stiamo verificando il tuo account...</p>
        )}

        {status === "success" && (
          <>
            <h2>Email verificata!</h2>
            <p>Il tuo account è attivo. Ora puoi accedere.</p>

            <Link to="/login" className="access-page__primary">
              Vai al login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h2>Link non valido o scaduto</h2>
            <p>
              Il link potrebbe essere scaduto oppure essere già stato
              utilizzato.
            </p>

            <p className="access-page__account">
              <Link to="/verifica-email">Richiedi un nuovo link</Link>
            </p>
          </>
        )}
      </section>
    </PublicAccessLayout>
  );
}

export default VerifyAccountPage;
