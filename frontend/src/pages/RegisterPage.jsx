import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/useAuth";
import PublicAccessLayout from "./PublicAccessLayout";

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
      // Recuperiamo il risultato della registrazione
      const result = await register(firstName.trim(), email.trim(), password);
      // Dopo la registrazione mostriamo la pagina di verifica
      // Mostriamo la pagina di verifica e il messaggio del backend
      navigate("/verifica-email", {
        replace: true,
        state: {
          email: email.trim(),
          message: result.message,
        },
      });
    } catch (err) {
      setError(err.message || "Impossibile completare la registrazione.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicAccessLayout
      variant="register"
      eyebrow="Uno spazio tutto tuo"
      title="Inizia con i tuoi tempi."
      description="Un posto dove raccogliere i tuoi pensieri, come vengono."
    >
      <section className="access-page__panel" aria-labelledby="register-title">
        <h2 id="register-title">Crea un account</h2>

        <form
          className="access-form"
          onSubmit={handleSubmit}
          aria-labelledby="register-title"
        >
          <div className="access-form__field">
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

          <div className="access-form__field">
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

          <div className="access-form__field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="register-password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              required
            />
            <small id="register-password-hint">Almeno 12 caratteri</small>
          </div>

          <div className="access-form__field">
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
            <p className="access-form__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="access-page__primary"
            disabled={isLoading}
          >
            {isLoading ? "Creazione in corso..." : "Crea il mio spazio"}
            {!isLoading && <ArrowRight size={19} aria-hidden="true" />}
          </button>
        </form>

        <p className="access-page__account">
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </section>
    </PublicAccessLayout>
  );
}

export default RegisterPage;
