import { CalendarDays, ListTodo, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getTodayDate } from "../../utils/date";
import {
  canCompleteAction,
  getOpenItems,
  getTodayItems,
  getOverdueActions,
} from "../../utils/organizeItems";

import "./TodayList.css";

const ICONS = {
  ACTION: ListTodo,
  EVENT: CalendarDays,
};

// Converte una data ISO in formato italiano.
function formatDate(date) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function TodayList({
  items = [],
  onComplete,
  onOpenItem,
  completingId = null,
  completionError = "",
}) {
  const navigate = useNavigate();
  const todayDate = getTodayDate();

  // 1. Selezione degli elementi
  const todayItems = getTodayItems(items, todayDate);
  const overdueActions = getOverdueActions(items, todayDate);

  // 2. Riepilogo della giornata
  const actionsCount = todayItems.filter(canCompleteAction).length;

  const eventsCount = todayItems.filter(
    (item) => item.type === "EVENT" && !item.uncertain,
  ).length;

  const uncertainCount = getOpenItems(items).filter(
    (item) => item.uncertain === true,
  ).length;

  return (
    <section className="today">
      {/* INTESTAZIONE */}
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

      {/* RIEPILOGO */}
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

      {/* ERRORI */}
      {completionError && (
        <p className="today__error" role="alert">
          {completionError}
        </p>
      )}

      {/* ATTIVITÀ DI OGGI */}
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

      {/* AZIONI ARRETRATE DA RIVEDERE */}
      {overdueActions.length > 0 && (
        <div className="today__overdue">
          <div className="today__header">
            <h2>Da rivedere ({overdueActions.length})</h2>
          </div>

          <div className="today__list">
            {overdueActions.map((item) => (
              <div className="today__item" key={item.id}>
                <div className="today__icon">
                  <AlertTriangle
                    size={17}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>

                <div className="today__content">
                  <h3>{item.title}</h3>

                  <p>Prevista per il {formatDate(item.date)}</p>

                  <button
                    className="today__view-all"
                    type="button"
                    onClick={() => onOpenItem?.(item)}
                    aria-label={`Rivedi attività: ${item.title}`}
                  >
                    Rivedi attività
                  </button>
                </div>

                <span aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default TodayList;
