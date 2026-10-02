import { Sparkles, ArrowRight } from "lucide-react";
import "./NextStepCard.css";

function NextStepCard() {
  return (
    <section className="next-step-card">
      <div className="next-step-card__icon">
        <Sparkles size={18} strokeWidth={1.5} />
      </div>

      <div className="next-step-card__content">
        <span>Il prossimo passo</span>

        <h2>Hai 25 minuti liberi.</h2>

        <p>
          Potresti iniziare <strong>“Studia React”</strong>
        </p>
      </div>

      <button
        className="next-step-card__action"
        type="button"
        aria-label="Vai al prossimo passo"
      >
        <ArrowRight size={17} strokeWidth={1.5} />
      </button>
    </section>
  );
}

export default NextStepCard;
