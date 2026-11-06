import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useMindDumps } from "../hooks/useMindDumps";
import { useMindDumpItemActions } from "../hooks/useMindDumpItemActions";
import { getTodayDate, parseCalendarDate } from "../utils/date";
import { getOpenItems } from "../utils/organizeItems";

import CalendarAgenda from "../components/CalendarAgenda/CalendarAgenda";
import EditableItemQuickPanel from "../components/ItemQuickPanel/EditableItemQuickPanel";

import "./CalendarPage.css";

const weekdays = ["L", "M", "M", "G", "V", "S", "D"];

const monthFormatter = new Intl.DateTimeFormat("it-IT", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function CalendarPage() {
  const today = getTodayDate();

  const [visibleMonth, setVisibleMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedItem, setSelectedItem] = useState(null);

  const { items, reload, isLoading, error } = useMindDumps();

  const { completeItem, completingId, completionError, clearCompletionError } =
    useMindDumpItemActions({ items, reload });

  // Costruzione del mese.
  const [year, month] = visibleMonth.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const monthLength = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const emptyDays = (firstDay.getUTCDay() + 6) % 7;

  const days = [
    ...Array(emptyDays).fill(null),
    ...Array.from({ length: monthLength }, (_, index) => index + 1),
  ];

  // Leggiamo gli impegni già salvati nel database.
  const scheduledItems = getOpenItems(items).filter(
    (item) =>
      (item.type === "ACTION" || item.type === "EVENT") &&
      !item.uncertain &&
      parseCalendarDate(item.date),
  );

  const selectedItems = scheduledItems
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  function changeMonth(offset) {
    const next = new Date(Date.UTC(year, month - 1 + offset, 1));
    const nextMonth = next.toISOString().slice(0, 7);

    setVisibleMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  }

  function goToToday() {
    setVisibleMonth(today.slice(0, 7));
    setSelectedDate(today);
  }

  // Apertura del pannello condiviso.
  function handleOpenItem(item) {
    clearCompletionError();
    setSelectedItem(item);
  }

  // Il pannello si chiude solo dopo il completamento riuscito.
  async function handleCompleteFromCalendar(itemId) {
    const completed = await completeItem(itemId);

    if (completed) {
      setSelectedItem((current) => current?.id === itemId ? null : current);
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-page__header">
        <span>IL TUO TEMPO</span>
        <h1>Calendario</h1>
        <p>I tuoi impegni, senza perdere di vista ciò che conta.</p>
      </header>

      <section className="calendar-page__card">
        <div className="calendar-page__toolbar">
          <h2>{monthFormatter.format(firstDay)}</h2>

          <div className="calendar-page__controls">
            <button type="button" onClick={goToToday}>
              Oggi
            </button>

            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Mese precedente"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Mese successivo"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="calendar-page__grid">
          {weekdays.map((day, index) => (
            <span className="calendar-page__weekday" key={index}>
              {day}
            </span>
          ))}

          {days.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} />;
            }

            const date = `${visibleMonth}-${String(day).padStart(2, "0")}`;
            const count = scheduledItems.filter(
              (item) => item.date === date,
            ).length;

            const classes = [
              "calendar-page__day",
              date === today ? "calendar-page__day--today" : "",
              date === selectedDate ? "calendar-page__day--selected" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={date}
                type="button"
                className={classes}
                onClick={() => setSelectedDate(date)}
                aria-label={`${day} ${monthFormatter.format(firstDay)}, ${count} impegni`}
                aria-pressed={date === selectedDate}
                aria-current={date === today ? "date" : undefined}
              >
                <span>{day}</span>
                {count > 0 && <small>{count}</small>}
              </button>
            );
          })}
        </div>
      </section>

      <CalendarAgenda
        selectedDate={selectedDate}
        items={selectedItems}
        isLoading={isLoading}
        error={error}
        onOpenItem={handleOpenItem}
      />

      {selectedItem && (
        <EditableItemQuickPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          reload={reload}
          onComplete={handleCompleteFromCalendar}
          isCompleting={completingId !== null}
          completionError={completionError}
        />
      )}
    </main>
  );
}

export default CalendarPage;
