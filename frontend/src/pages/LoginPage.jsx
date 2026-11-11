import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useAuth } from "../context/useAuth";
import PublicAccessLayout from "./PublicAccessLayout";

// Recuperiamo il Client ID di Google
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // Dati inseriti dall'utente
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Gestiamo gli stati della pagina
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  // Riferimenti utilizzati per il login Google
  const googleButtonRef = useRef(null);
  const googleLoginRef = useRef(loginWithGoogle);
  const loginInProgressRef = useRef(false);

  // Manteniamo aggiornato il riferimento al login Google
  useEffect(() => {
    googleLoginRef.current = loginWithGoogle;
  }, [loginWithGoogle]);

  // LOGIN CON EMAIL E PASSWORD

  async function handleSubmit(event) {
    event.preventDefault();

    // Evitiamo richieste di login contemporanee
    if (loginInProgressRef.current) return;

    loginInProgressRef.current = true;

    setError("");
    setNeedsEmailVerification(false);
    setIsLoading(true);

    try {
      // Chiediamo al backend di effettuare il login
      await login(email.trim(), password);

      // Se il login riesce, entriamo nell'app
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Impossibile effettuare l'accesso.");

      // Un account PENDING deve prima verificare l'email
      setNeedsEmailVerification(err.status === 403);
    } finally {
      loginInProgressRef.current = false;
      setIsLoading(false);
    }
  }

  // LOGIN CON GOOGLE

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let active = true;

    // Riceviamo la credenziale restituita da Google
    async function handleGoogleCredential(response) {
      if (!active || !response?.credential || loginInProgressRef.current) {
        return;
      }

      loginInProgressRef.current = true;

      setError("");
      setNeedsEmailVerification(false);
      setIsLoading(true);

      try {
        // Il backend verifica Google e restituisce il nostro JWT
        await googleLoginRef.current(response.credential);

        if (active) {
          navigate("/", { replace: true });
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Accesso Google non riuscito.");
        }
      } finally {
        loginInProgressRef.current = false;

        if (active) {
          setIsLoading(false);
        }
      }
    }

    // Prepariamo il pulsante ufficiale Google
    function initializeGoogle() {
      if (!active || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        ux_mode: "popup",
      });

      // Evitiamo di creare pulsanti duplicati
      googleButtonRef.current.replaceChildren();

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline_dark",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.min(340, googleButtonRef.current.clientWidth),
        locale: "it",
      });
    }

    // Mostriamo un errore se lo script Google non viene caricato
    function handleScriptError() {
      if (active) {
        setGoogleError(
          "Impossibile caricare Google. Ricarica la pagina e riprova.",
        );
      }
    }

    // Controlliamo se lo script Google è già presente
    let script = document.querySelector("script[data-adhd-google-identity]");

    // Se non esiste, lo creiamo
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.dataset.adhdGoogleIdentity = "true";
    }

    // Gestiamo il caricamento dello script
    script.addEventListener("load", initializeGoogle);
    script.addEventListener("error", handleScriptError);

    // Inizializziamo Google quando è disponibile
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else if (!script.isConnected) {
      document.head.appendChild(script);
    }

    // Rimuoviamo gli eventi quando lasciamo la pagina
    return () => {
      active = false;

      script.removeEventListener("load", initializeGoogle);
      script.removeEventListener("error", handleScriptError);
    };
  }, [navigate]);

  return (
    <PublicAccessLayout
      variant="login"
      eyebrow="Il tuo spazio ti aspetta"
      title="Bentornato."
      description="Riprendiamo da dove ci siamo fermati. Un pensiero alla volta."
    >
      <section className="access-page__panel" aria-labelledby="login-title">
        <h2 id="login-title">Accedi</h2>

        {/* LOGIN CON EMAIL E PASSWORD */}

        <form
          className="access-form"
          onSubmit={handleSubmit}
          aria-labelledby="login-title"
        >
          <div className="access-form__field">
            <label htmlFor="login-email">Email</label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="La tua email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="access-form__field">
            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="La tua password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {/* Mostriamo eventuali errori di accesso */}

          {error && (
            <p className="access-form__error" role="alert">
              {error}
            </p>
          )}

          {/* Permettiamo di richiedere una nuova email di verifica */}

          {needsEmailVerification && (
            <p className="access-page__account">
              Non hai ricevuto l'email?{" "}
              <Link to="/verifica-email" state={{ email: email.trim() }}>
                Richiedi un nuovo link
              </Link>
            </p>
          )}

          <button
            type="submit"
            className="access-page__primary"
            disabled={isLoading}
          >
            {isLoading ? "Accesso in corso..." : "Entra nel tuo spazio"}

            {!isLoading && <ArrowRight size={19} aria-hidden="true" />}
          </button>
        </form>

        {/* LOGIN GOOGLE */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <span>oppure</span>

          {GOOGLE_CLIENT_ID ? (
            <div
              ref={googleButtonRef}
              style={{
                width: "100%",
                maxWidth: "400px",
                opacity: isLoading ? 0.6 : 1,
                pointerEvents: isLoading ? "none" : "auto",
              }}
            />
          ) : (
            <p className="access-form__error" role="alert">
              Accesso Google non configurato.
            </p>
          )}

          {googleError && (
            <p className="access-form__error" role="alert">
              {googleError}
            </p>
          )}
        </div>

        {/* LINK ALLA REGISTRAZIONE */}

        <p className="access-page__account">
          Non hai un account? <Link to="/registrazione">Registrati</Link>
        </p>

        {/* RITORNO ALLA PAGINA DI BENVENUTO */}

        <Link to="/benvenuto" className="access-page__back">
          <ArrowLeft size={16} aria-hidden="true" />
          Torna al benvenuto
        </Link>
      </section>
    </PublicAccessLayout>
  );
}

export default LoginPage;
