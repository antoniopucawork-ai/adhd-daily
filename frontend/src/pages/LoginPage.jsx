import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "../context/useAuth";
import PublicAccessLayout from "./PublicAccessLayout";

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
    <PublicAccessLayout
      variant="login"
      eyebrow="Il tuo spazio ti aspetta"
      title="Bentornato."
      description="Riprendiamo da dove ci siamo fermati. Un pensiero alla volta."
    >
      <section className="access-page__panel" aria-labelledby="login-title">
        <h2 id="login-title">Accedi</h2>

        <form className="access-form" onSubmit={handleSubmit} aria-labelledby="login-title">
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

          {error && (
            <p className="access-form__error" role="alert">
              {error}
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

        <p className="access-page__account">
          Non hai un account? <Link to="/registrazione">Registrati</Link>
        </p>
        <Link to="/benvenuto" className="access-page__back">
          <ArrowLeft size={16} aria-hidden="true" />
          Torna al benvenuto
        </Link>
      </section>
    </PublicAccessLayout>
  );
}

export default LoginPage;
