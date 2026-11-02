import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Pencil,
} from "lucide-react";

import "./MindDumpResult.css";

const MAX_TITLE_LENGTH = 200;

const TYPE_LABELS = {
  ACTION: "Da fare",
  EVENT: "In programma",
  INTENTION: "Forse",
  MEMORY: "Da ricordare",
  THOUGHT: "Pensieri liberi",
};

// Mostriamo le date in modo leggibile.
function formatDate(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Data da verificare";
  }

  const today = new Date();
  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  if (isTomorrow) return "Domani";

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function MindDumpResult({ result, onBack, onEdit, onConfirm, isSaving }) {
  // Non permettiamo di confermare titoli troppo lunghi.
  const hasInvalidTitles = result.items.some(
    (item) => !item.title.trim() || item.title.length > MAX_TITLE_LENGTH,
  );

  return (
    <section className="mind-result">
      <button
        className="mind-result__back"
        type="button"
        onClick={onBack}
        disabled={isSaving}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        <span>Torna a scrivere</span>
      </button>

      <header className="mind-result__header">
        <p className="mind-result__eyebrow">Prima di salvare</p>

        <h1>Ecco cosa ho capito.</h1>

        <p>
          Controlla i tuoi pensieri. Puoi modificare quello che non ti sembra
          corretto.
        </p>
      </header>

      <div className="mind-result__items">
        {result.items.map((item) => {
          const hasLongTitle = item.title.length > MAX_TITLE_LENGTH;

          return (
            <article className="mind-result__card" key={item.id}>
              <div className="mind-result__card-heading">
                <span className="mind-result__type">
                  {TYPE_LABELS[item.type] ?? "Pensiero"}
                </span>

                <button
                  className="mind-result__edit"
                  type="button"
                  onClick={() => onEdit(item)}
                  disabled={isSaving}
                  aria-label={`Modifica ${item.title}`}
                >
                  <Pencil size={17} strokeWidth={1.6} aria-hidden="true" />
                  <span>Modifica</span>
                </button>
              </div>

              <h2>{item.title}</h2>

              {(item.date || item.time) && (
                <div className="mind-result__details">
                  {item.date && (
                    <div className="mind-result__meta">
                      <CalendarDays size={16} aria-hidden="true" />

                      <span>{formatDate(item.date)}</span>
                    </div>
                  )}

                  {item.time && (
                    <div className="mind-result__meta">
                      <Clock3 size={16} aria-hidden="true" />

                      <span>{item.time}</span>
                    </div>
                  )}
                </div>
              )}

              {item.uncertain === true && (
                <p className="mind-result__uncertain">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>Informazione da verificare</span>
                </p>
              )}

              {hasLongTitle && (
                <p className="mind-result__warning">
                  Il titolo supera i 200 caratteri. Modificalo prima di
                  confermare.
                </p>
              )}
            </article>
          );
        })}
      </div>

      {hasInvalidTitles && (
        <p className="mind-result__notice" role="alert">
          Controlla i titoli segnalati prima di salvare.
        </p>
      )}

      <div className="mind-result__footer">
        <button
          className="mind-result__confirm"
          type="button"
          onClick={onConfirm}
          disabled={isSaving || hasInvalidTitles}
          aria-busy={isSaving}
        >
          <span>
            {isSaving ? "Salvataggio in corso..." : "Conferma e salva"}
          </span>

          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <p>Nulla viene salvato nel database prima della tua conferma.</p>
      </div>
    </section>
  );
}

export default MindDumpResult;
