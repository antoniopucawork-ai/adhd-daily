import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Brain } from "lucide-react";
import { useAuth } from "../context/useAuth";

import "./WelcomePage.css";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Impossibile effettuare l'accesso.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="welcome-page">
      <div className="welcome-page__content">
        <div className="welcome-page__brand">
          <Brain size={30} strokeWidth={1.5} />
          <span>ADHD Daily</span>
        </div>

        <div className="welcome-page__intro">
          <span className="welcome-page__eyebrow">
            IL TUO SPAZIO TI ASPETTA
          </span>

          <h1>Bentornato.</h1>

          <p>
            Riprendiamo da dove ci siamo fermati.
            <br />
            Un pensiero alla volta.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
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

          <div className="auth-form__field">
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

          {error && (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="welcome-page__primary"
            disabled={isLoading}
          >
            {isLoading ? "Accesso in corso..." : "Entra nel tuo spazio"}
            {!isLoading && <ArrowRight size={19} />}
          </button>
        </form>

        <div className="welcome-page__actions">
          <Link to="/registrazione" className="welcome-page__secondary">
            Non hai un account? Registrati
          </Link>

          <Link to="/benvenuto" className="welcome-page__secondary">
            <ArrowLeft size={16} />
            Torna indietro
          </Link>
        </div>

        <div className="welcome-page__footer">
          <span>Un pensiero alla volta.</span>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
