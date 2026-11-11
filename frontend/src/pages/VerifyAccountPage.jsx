import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiRequest } from "../services/api";
import PublicAccessLayout from "./PublicAccessLayout";

function VerifyAccountPage() {
  // Recuperiamo il token dal link ricevuto via email
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Gestiamo lo stato della verifica
  const [status, setStatus] = useState(token ? "loading" : "error");

  // Evitiamo di inviare due volte la stessa richiesta
  const verificationStarted = useRef(false);

  useEffect(() => {
    // Non possiamo verificare l'account senza un token
    if (!token || verificationStarted.current) return;

    verificationStarted.current = true;

    // Inviamo il token al backend per attivare l'account
    async function verifyAccount() {
      try {
        await apiRequest("/api/auth/verify-account", {
          method: "POST",
          body: JSON.stringify({ token }),
        });

        // L'account è stato attivato correttamente
        setStatus("success");
      } catch (error) {
        // Il token è scaduto oppure non è valido
        if (error.status === 400) {
          setStatus("error");
        } else {
          // Il server non è riuscito a completare la verifica
          setStatus("server-error");
        }
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
        {/* VERIFICA IN CORSO */}

        {status === "loading" && (
          <p role="status">Stiamo verificando il tuo account...</p>
        )}

        {/* ACCOUNT VERIFICATO */}

        {status === "success" && (
          <>
            <h2>Email verificata!</h2>

            <p>Il tuo account è attivo. Ora puoi accedere.</p>

            <Link to="/login" className="access-page__primary">
              Vai al login
            </Link>
          </>
        )}

        {/* LINK NON VALIDO O SCADUTO */}

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

        {/* ERRORE TEMPORANEO DEL SERVER */}

        {status === "server-error" && (
          <>
            <h2>Non siamo riusciti a verificare l'account</h2>

            <p>
              Potrebbe esserci un problema temporaneo. Riprova tra poco oppure
              controlla se riesci ad accedere.
            </p>

            <button
              type="button"
              className="access-page__primary"
              onClick={() => window.location.reload()}
            >
              Riprova la verifica
            </button>

            <p className="access-page__account">
              <Link to="/login">Torna al login</Link>
            </p>
          </>
        )}
      </section>
    </PublicAccessLayout>
  );
}

export default VerifyAccountPage;
