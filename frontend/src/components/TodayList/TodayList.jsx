import {
  CalendarDays,
  CheckCircle2,
  Lightbulb,
  ListTodo,
  AlertTriangle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { getTodayDate } from "../../utils/date";

import "./TodayList.css";

function TodayList({ items = [], onComplete }) {
  const navigate = useNavigate();

  // Data corrente nel formato YYYY-MM-DD
  const todayDate = getTodayDate();

  const todayItems = items.filter(
    (item) => item.date === todayDate && item.status !== "DONE",
  );

  // Attività confermate previste per oggi
  const actionsCount = todayItems.filter(
    (item) => item.type === "ACTION" && !item.uncertain,
  ).length;

  // Eventi confermati previsti per oggi
  const eventsCount = todayItems.filter(
    (item) => item.type === "EVENT" && !item.uncertain,
  ).length;

  // Informazioni incerte ancora da verificare
  // Anche se non hanno una data
  const uncertainCount = items.filter(
    (item) => item.uncertain === true && item.status !== "DONE",
  ).length;

  const getItemIcon = (type) => {
    const icons = {
      ACTION: ListTodo,
      EVENT: CalendarDays,
      MEMORY: CheckCircle2,
      INTENTION: Lightbulb,
    };

    return icons[type] || ListTodo;
  };

  return (
    <section className="today">
      {/* INTESTAZIONE */}

      <div className="today__header">
        <h2>Oggi</h2>

        <button
          className="today__view-all"
          type="button"
          onClick={() => navigate("/archivio")}
        >
          Vedi tutto <span aria-hidden="true">›</span>
        </button>
      </div>

      {/* RIEPILOGO DELLA GIORNATA */}

      <div className="today__summary">
        {/* ATTIVITÀ */}

        <div className="today__summary-card">
          <ListTodo size={20} strokeWidth={1.7} aria-hidden="true" />

          <strong>{actionsCount}</strong>

          <span>da fare</span>
        </div>

        {/* EVENTI */}

        <div className="today__summary-card">
          <CalendarDays size={20} strokeWidth={1.7} aria-hidden="true" />

          <strong>{eventsCount}</strong>

          <span>eventi</span>
        </div>

        {/* INFORMAZIONI DA VERIFICARE */}

        <div className="today__summary-card">
          <AlertTriangle size={20} strokeWidth={1.7} aria-hidden="true" />

          <strong>{uncertainCount}</strong>

          <span>da verificare</span>
        </div>
      </div>

      {/* ELENCO DELLE ATTIVITÀ DI OGGI */}

      <div className="today__list">
        {todayItems.length === 0 ? (
          <div className="today__empty">
            <p>Niente in programma per oggi.</p>
          </div>
        ) : (
          todayItems.map((item) => {
            const Icon = getItemIcon(item.type);

            return (
              <div className="today__item" key={item.id}>
                {/* ICONA */}

                <div className="today__icon">
                  <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                </div>

                {/* CONTENUTO */}

                <div className="today__content">
                  <h3>{item.title}</h3>

                  <p>{item.time || "Durante la giornata"}</p>
                </div>

                {/* COMPLETAMENTO */}

                <button
                  className="today__check"
                  type="button"
                  onClick={() => onComplete?.(item.id)}
                  aria-label={`Completa ${item.title}`}
                />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default TodayList;
