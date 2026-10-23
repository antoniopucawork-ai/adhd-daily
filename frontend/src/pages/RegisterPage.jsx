import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Brain } from "lucide-react";
import { useAuth } from "../context/useAuth";

import "./WelcomePage.css";
import "./LoginPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    if (password.length < 12) {
      setError("La password deve contenere almeno 12 caratteri.");
      return;
    }

    setIsLoading(true);

    try {
      await register(firstName.trim(), email.trim(), password);

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
        },
      });
    } catch (err) {
      setError(err.message || "Impossibile completare la registrazione.");
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
          <span className="welcome-page__eyebrow">UNO SPAZIO TUTTO TUO</span>

          <h1>Qui inizia il tuo spazio.</h1>

          <p>
            Un posto dove raccogliere i tuoi pensieri,
            <br />
            con i tuoi tempi e le tue esigenze.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="register-name">Come ti chiami?</label>
            <input
              id="register-name"
              type="text"
              autoComplete="given-name"
              placeholder="Il tuo nome"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="La tua email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Almeno 12 caratteri"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-confirm-password">Conferma password</label>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Ripeti la password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
            {isLoading ? "Creazione in corso..." : "Crea il mio spazio"}
            {!isLoading && <ArrowRight size={19} />}
          </button>
        </form>

        <div className="welcome-page__actions">
          <Link to="/login" className="welcome-page__secondary">
            <ArrowLeft size={16} />
            Hai già un account? Accedi
          </Link>
        </div>

        <div className="welcome-page__footer">
          <span>Un pensiero alla volta.</span>
        </div>
      </div>
    </main>
  );
}

export default RegisterPage;
