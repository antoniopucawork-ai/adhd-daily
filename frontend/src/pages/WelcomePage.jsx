import { Link } from "react-router-dom";
import { ArrowRight, Brain } from "lucide-react";

import "./WelcomePage.css";

function WelcomePage() {
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
            Non serve avere tutto in ordine.
            <br />
            C'è spazio anche per i pensieri in disordine.
          </p>
        </div>

        <div className="welcome-page__actions">
          <Link to="/registrazione" className="welcome-page__primary">
            Crea il tuo spazio
            <ArrowRight size={19} />
          </Link>

          <Link to="/login" className="welcome-page__secondary">
            Ho già un account
          </Link>
        </div>

        <div className="welcome-page__footer">
          <span>Un pensiero alla volta.</span>
        </div>
      </div>
    </main>
  );
}

export default WelcomePage;
