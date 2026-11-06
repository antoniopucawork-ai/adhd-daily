import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PublicAccessLayout from "./PublicAccessLayout";

function WelcomePage() {
  return (
    <PublicAccessLayout
      variant="welcome"
      eyebrow="Uno spazio tutto tuo"
      title="Qui inizia il tuo spazio."
      description="Non serve avere tutto in ordine. C’è spazio anche per i pensieri in disordine."
    >
      <div className="access-page__actions">
        <Link to="/registrazione" className="access-page__primary">
          Crea il tuo spazio
          <ArrowRight size={19} aria-hidden="true" />
        </Link>
        <Link to="/login" className="access-page__secondary">
          Ho già un account
        </Link>
      </div>
      <p className="access-page__note">Un pensiero alla volta.</p>
    </PublicAccessLayout>
  );
}

export default WelcomePage;
