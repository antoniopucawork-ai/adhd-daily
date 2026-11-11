import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../services/api";
import PublicAccessLayout from "./PublicAccessLayout";

function VerifyEmailPage() {
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Richiediamo un nuovo link di verifica
  const handleResend = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const data = await apiRequest("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Impossibile inviare l'email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicAccessLayout
      variant="register"
      eyebrow="Ci siamo quasi"
      title="Verifica la tua email."
      description="Controlla la tua casella email oppure richiedi un nuovo link di verifica."
    >
      <section className="access-page__panel">
        <h2>Controlla la tua casella email</h2>

        <p>Il link di verifica è valido per 5 minuti.</p>

        <form className="access-form" onSubmit={handleResend}>
          <div className="access-form__field">
            <label htmlFor="verification-email">Email</label>

            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {message && <p role="status">{message}</p>}
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
            {isLoading ? "Invio in corso..." : "Invia un nuovo link"}
          </button>
        </form>

        <p className="access-page__account">
          Hai già verificato l'email? <Link to="/login">Accedi</Link>
        </p>
      </section>
    </PublicAccessLayout>
  );
}

export default VerifyEmailPage;
