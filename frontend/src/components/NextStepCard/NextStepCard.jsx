import { Sparkles, ArrowRight, Check } from "lucide-react";

import { getTodayDate } from "../../utils/date";
import { getNextAction } from "../../utils/organizeItems";

import "./NextStepCard.css";

function NextStepCard({ items = [], onOpenItem }) {
  const nextItem = getNextAction(items, getTodayDate());

  // Nessuna azione disponibile.
  if (!nextItem) {
    return (
      <section className="next-step-card">
        <div className="next-step-card__icon">
          <Check size={18} strokeWidth={1.5} aria-hidden="true" />
        </div>

        <div className="next-step-card__content">
          <span>Il prossimo passo</span>
          <h2>Per ora è tutto.</h2>
          <p>Non hai altre azioni disponibili.</p>
        </div>
      </section>
    );
  }

  // Apriamo il pannello rapido tramite la Home.
  function handleOpenItem() {
    onOpenItem?.(nextItem);
  }

  return (
    <button
      className="next-step-card glass-surface"
      type="button"
      onClick={handleOpenItem}
      aria-label={`Apri il dettaglio di ${nextItem.title}`}
    >
      <div className="next-step-card__icon">
        <Sparkles size={18} strokeWidth={1.5} aria-hidden="true" />
      </div>

      <div className="next-step-card__content">
        <span>Il prossimo passo</span>
        <h2>{nextItem.title}</h2>
        <p>Puoi iniziare da qui, con calma.</p>
      </div>

      <span className="next-step-card__action" aria-hidden="true">
        <ArrowRight size={17} strokeWidth={1.5} />
      </span>
    </button>
  );
}

export default NextStepCard;
