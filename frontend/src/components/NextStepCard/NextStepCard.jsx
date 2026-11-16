import { Sparkles, ArrowRight, Check } from "lucide-react";

import { parseCalendarDate } from "../../utils/date";

import "./NextStepCard.css";

function NextStepCard({
  nextItem = null,
  onOpenItem,
  onComplete,
  completingId = null,
  completionError = "",
}) {
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

  const isCompleting = completingId === nextItem.id;
  const date = parseCalendarDate(nextItem.date);
  const dateLabel = date && new Intl.DateTimeFormat("it-IT", {
    timeZone: "UTC", day: "numeric", month: "long", year: "numeric",
  }).format(date);

  return (
    <section className="next-step-card glass-surface" aria-label="Il prossimo passo">
      <div className="next-step-card__icon">
        <Sparkles size={18} strokeWidth={1.5} aria-hidden="true" />
      </div>

      <div className="next-step-card__content">
        <span>Il prossimo passo</span>
        <h2>{nextItem.title}</h2>
        <p>
          {dateLabel ? `In programma: ${dateLabel}` : "Senza una data fissata"}
          {nextItem.time && ` · ${nextItem.time}`}
        </p>
      </div>

      <div className="next-step-card__actions">
        <button
          className="next-step-card__details"
          type="button"
          onClick={() => onOpenItem?.(nextItem)}
          disabled={completingId !== null}
          aria-label={`Apri il dettaglio di ${nextItem.title}`}
        >
          Dettagli <ArrowRight size={17} aria-hidden="true" />
        </button>
        <button
          className="next-step-card__complete"
          type="button"
          onClick={() => onComplete?.(nextItem.id)}
          disabled={completingId !== null || !onComplete}
          aria-label={`Completa ${nextItem.title}`}
          aria-busy={isCompleting}
        >
          <Check size={17} aria-hidden="true" />
          {isCompleting ? "Completamento..." : "Completa"}
        </button>
      </div>
      {completionError && (
        <p className="next-step-card__error" role="alert">{completionError}</p>
      )}
    </section>
  );
}

export default NextStepCard;
