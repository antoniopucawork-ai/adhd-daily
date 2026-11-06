import { CalendarDays } from "lucide-react";
import { parseCalendarDate } from "../../utils/date";

const dayFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function CalendarAgenda({
  selectedDate,
  items = [],
  isLoading = false,
  error = "",
  onOpenItem,
}) {
  const date = parseCalendarDate(selectedDate);

  return (
    <section className="calendar-page__agenda" aria-label="Impegni del giorno">
      <div className="calendar-page__agenda-header">
        <CalendarDays size={21} aria-hidden="true" />
        <h2>{date ? dayFormatter.format(date) : "Giorno selezionato"}</h2>
      </div>

      {isLoading ? (
        <p>Carichiamo i tuoi impegni...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : items.length === 0 ? (
        <p>Nessun impegno programmato per questo giorno.</p>
      ) : (
        <ul className="calendar-page__events">
          {items.map((item) => (
            <li key={item.id}>
              <button
                className="calendar-page__event-open"
                type="button"
                onClick={() => onOpenItem?.(item)}
                aria-label={`Apri il dettaglio di ${item.title}`}
              >
                <span>{item.time || "Senza orario"}</span>

                <strong>{item.title}</strong>

                <small>{item.type === "EVENT" ? "Evento" : "Da fare"}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CalendarAgenda;
