import { Sparkles, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTodayDate } from "../../utils/date";
import { getNextAction } from "../../utils/organizeItems";
import "./NextStepCard.css";

function NextStepCard({ items = [] }) {
  const navigate = useNavigate();

  const nextItem = getNextAction(items, getTodayDate());

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

        <h2>{nextItem.title}</h2>

        <p>Puoi iniziare da qui, con calma.</p>
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
