import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Pencil,
} from "lucide-react";

import "./MindDumpResult.css";

function MindDumpResult({ result, onBack, onEdit, onConfirm }) {
  const formatDate = (date) => {
    if (!date) return null;

    const today = new Date();

    const targetDate = new Date(`${date}T00:00:00`);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isTomorrow =
      targetDate.getFullYear() === tomorrow.getFullYear() &&
      targetDate.getMonth() === tomorrow.getMonth() &&
      targetDate.getDate() === tomorrow.getDate();

    if (isTomorrow) {
      return "Domani";
    }

    return new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(targetDate);
  };

  const getTypeLabel = (type) => {
    const labels = {
      ACTION: "Da fare",
      EVENT: "Evento",
      MEMORY: "Da ricordare",
      INTENTION: "Idea",
    };

    return labels[type] || "Organizzato";
  };

  return (
    <section className="mind-result">
      <button className="mind-result__back" type="button" onClick={onBack}>
        <ArrowLeft size={17} strokeWidth={1.6} />

        <span>Indietro</span>
      </button>

      <header className="mind-result__header">
        <h1>Fatto.</h1>

        <p>Ecco cosa ho capito.</p>
      </header>

      <div className="mind-result__items">
        {result.items.map((item) => (
          <article className="mind-result__group" key={item.id}>
            <p className="mind-result__type">{getTypeLabel(item.type)}</p>

            <div className="mind-result__card">
              <div className="mind-result__card-top">
                <div className="mind-result__content">
                  <h2>{item.title}</h2>

                  {item.date && (
                    <div className="mind-result__meta">
                      <CalendarDays size={15} strokeWidth={1.6} />

                      <span>
                        {formatDate(item.date)}

                        {item.time && ` · ${item.time}`}
                      </span>
                    </div>
                  )}

                  <div className="mind-result__meta mind-result__meta--muted">
                    <Bell size={15} strokeWidth={1.6} />

                    <span>
                      {item.reminder
                        ? "Promemoria attivo"
                        : "Nessun promemoria"}
                    </span>
                  </div>
                </div>

                <button
                  className="mind-result__edit"
                  type="button"
                  onClick={() => onEdit(item)}
                  aria-label={`Modifica ${item.title}`}
                >
                  <Pencil size={16} strokeWidth={1.6} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        className="mind-result__confirm"
        type="button"
        onClick={onConfirm}
      >
        <span>Conferma tutto</span>

        <ArrowRight size={18} strokeWidth={1.7} />
      </button>
    </section>
  );
}

export default MindDumpResult;
