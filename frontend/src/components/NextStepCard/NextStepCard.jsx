import { Sparkles, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./NextStepCard.css";

function NextStepCard({ items = [] }) {
  const navigate = useNavigate();

  const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  const nextItem = items.find(
    (item) =>
      item.date === todayDate &&
      item.status !== "DONE" &&
      item.type === "ACTION",
  );

  if (!nextItem) {
    return (
      <section className="next-step-card">
        <div className="next-step-card__icon">
          <Check size={18} strokeWidth={1.5} />
        </div>

        <div className="next-step-card__content">
          <span>Il prossimo passo</span>

          <h2>Per ora è tutto.</h2>

          <p>Non hai altre attività per oggi.</p>
        </div>
      </section>
    );
  }

  const handleOpenItem = () => {
    navigate(`/archivio#item-${nextItem.id}`);
  };

  return (
    <section className="next-step-card glass-surface">
      <div className="next-step-card__icon">
        <Sparkles size={18} strokeWidth={1.5} />
      </div>

      <div className="next-step-card__content">
        <span>Il prossimo passo</span>

        <h2>Una cosa alla volta.</h2>

        <p>
          Potresti iniziare <strong>“{nextItem.title}”</strong>
        </p>
      </div>

      <button
        className="next-step-card__action"
        type="button"
        onClick={handleOpenItem}
        aria-label={`Visualizza ${nextItem.title} nell'archivio`}
      >
        <ArrowRight size={17} strokeWidth={1.5} />
      </button>
    </section>
  );
}

export default NextStepCard;
