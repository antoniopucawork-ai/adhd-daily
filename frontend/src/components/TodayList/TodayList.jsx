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

const ICONS = {
  ACTION: ListTodo,
  EVENT: CalendarDays,
  MEMORY: CheckCircle2,
  INTENTION: Lightbulb,
};

function TodayList({
  items = [],
  onComplete,
  completingId = null,
  completionError = "",
}) {
  const navigate = useNavigate();
  const todayDate = getTodayDate();

  const todayItems = items.filter(
    (item) => item.date === todayDate && item.status !== "DONE",
  );

  const actionsCount = todayItems.filter(
    (item) => item.type === "ACTION" && !item.uncertain,
  ).length;

  const eventsCount = todayItems.filter(
    (item) => item.type === "EVENT" && !item.uncertain,
  ).length;

  const uncertainCount = items.filter(
    (item) => item.uncertain === true && item.status !== "DONE",
  ).length;

  return (
    <section className="today">
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

      <div className="today__summary">
        <div className="today__summary-card">
          <ListTodo size={20} strokeWidth={1.7} aria-hidden="true" />
          <strong>{actionsCount}</strong>
          <span>da fare</span>
        </div>

        <div className="today__summary-card">
          <CalendarDays size={20} strokeWidth={1.7} aria-hidden="true" />
          <strong>{eventsCount}</strong>
          <span>eventi</span>
        </div>

        <div className="today__summary-card">
          <AlertTriangle size={20} strokeWidth={1.7} aria-hidden="true" />
          <strong>{uncertainCount}</strong>
          <span>da verificare</span>
        </div>
      </div>

      {completionError && (
        <p role="alert" className="today__error">
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

            const canComplete = item.type === "ACTION" && !item.uncertain;

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
