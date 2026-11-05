import { CalendarDays, ListTodo, AlertTriangle } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { getTodayDate } from "../../utils/date";
import {
  canCompleteAction,
  getOpenItems,
  getTodayItems,
} from "../../utils/organizeItems";

import "./TodayList.css";

const ICONS = {
  ACTION: ListTodo,
  EVENT: CalendarDays,
};

function TodayList({
  items = [],
  onComplete,
  completingId = null,
  completionError = "",
}) {
  const navigate = useNavigate();
  const todayDate = getTodayDate();

  // Recuperiamo gli elementi di oggi.
  const todayItems = getTodayItems(items, todayDate);

  // Contiamo soltanto le azioni confermate.
  const actionsCount = todayItems.filter(canCompleteAction).length;

  const eventsCount = todayItems.filter(
    (item) => item.type === "EVENT" && !item.uncertain,
  ).length;

  // Da verificare include anche elementi di altri giorni.
  const uncertainCount = getOpenItems(items).filter(
    (item) => item.uncertain === true,
  ).length;

  return (
    <section className="today">
      <div className="today__header">
        <h2>Oggi</h2>

        <button
          className="today__view-all"
          type="button"
          onClick={() => navigate("/organizza")}
        >
          Vedi tutto <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="today__summary">
        <button
          className="today__summary-card"
          type="button"
          onClick={() => navigate("/organizza/da-fare")}
          aria-label={`Apri le attività in Organizza. ${actionsCount} previste oggi`}
        >
          <ListTodo size={20} strokeWidth={1.7} aria-hidden="true" />
          <strong>{actionsCount}</strong>
          <span>da fare</span>
        </button>

        <button
          className="today__summary-card"
          type="button"
          onClick={() => navigate("/organizza/in-programma")}
          aria-label={`Apri gli eventi in Organizza. ${eventsCount} previsti oggi`}
        >
          <CalendarDays size={20} strokeWidth={1.7} aria-hidden="true" />
          <strong>{eventsCount}</strong>
          <span>eventi</span>
        </button>

        <button
          className="today__summary-card"
          type="button"
          onClick={() => navigate("/organizza/da-verificare")}
          aria-label={`Apri le informazioni da verificare in Organizza. ${uncertainCount} in totale`}
        >
          <AlertTriangle size={20} strokeWidth={1.7} aria-hidden="true" />
          <strong>{uncertainCount}</strong>
          <span>da verificare</span>
        </button>
      </div>

      {completionError && (
        <p className="today__error" role="alert">
          {completionError}
        </p>
      )}

      <div className="today__list">
        {todayItems.length === 0 ? (
          <div className="today__empty">
            <p>Niente in programma per oggi.</p>
          </div>
        ) : (
          todayItems.map((item) => {
            const Icon = ICONS[item.type] || ListTodo;
            const canComplete = canCompleteAction(item);
            const isCompleting = completingId === item.id;

            return (
              <div
                className="today__item"
                key={item.id}
                aria-busy={isCompleting}
              >
                <div className="today__icon">
                  <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                </div>

                <div className="today__content">
                  <h3>{item.title}</h3>
                  <p>{item.time || "Durante la giornata"}</p>
                </div>

                {canComplete ? (
                  <button
                    className="today__check"
                    type="button"
                    disabled={completingId !== null}
                    onClick={() => onComplete?.(item.id)}
                    aria-label={
                      isCompleting
                        ? `Completamento di ${item.title} in corso`
                        : `Completa ${item.title}`
                    }
                  />
                ) : (
                  <span aria-hidden="true" />
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default TodayList;
