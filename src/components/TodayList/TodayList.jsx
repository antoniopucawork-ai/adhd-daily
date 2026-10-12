import { CalendarDays, CheckCircle2, Lightbulb, ListTodo } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTodayDate } from "../../utils/date";
import "./TodayList.css";

function TodayList({ items = [], onComplete }) {
  const navigate = useNavigate();
  const todayDate = getTodayDate();

  const todayItems = items.filter(
    (item) => item.date === todayDate && item.status !== "DONE",
  );

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
      <div className="today__header">
        <h2>Oggi</h2>

        <button
          className="today__view-all"
          type="button"
          onClick={() => navigate("/archivio")}
        >
          Vedi tutto <span>›</span>
        </button>
      </div>

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
                <div className="today__icon">
                  <Icon size={17} strokeWidth={1.5} />
                </div>

                <div className="today__content">
                  <h3>{item.title}</h3>
                  <p>{item.time || "Durante la giornata"}</p>
                </div>

                <button
                  className="today__check"
                  type="button"
                  onClick={() => onComplete(item.id)}
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
