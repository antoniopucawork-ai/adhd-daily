import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./MindDumpCard.css";

function MindDumpCard() {
  const navigate = useNavigate();

  return (
    <button
      className="mind-dump-card"
      type="button"
      onClick={() => navigate("/svuota")}
      aria-label="Apri Svuota la mente"
    >
      <span className="mind-dump-card__visual" aria-hidden="true">
        <span className="mind-dump-card__steam">〰</span>
      </span>

      <span className="mind-dump-card__content">
        <span className="mind-dump-card__title">Svuota la mente</span>

        <span className="mind-dump-card__description">
          Scrivi tutto quello che hai in testa.
          <br />
          Io lo organizzo per te.
        </span>
      </span>

      <span className="mind-dump-card__arrow" aria-hidden="true">
        <ArrowRight size={18} strokeWidth={1.5} />
      </span>
    </button>
  );
}

export default MindDumpCard;
