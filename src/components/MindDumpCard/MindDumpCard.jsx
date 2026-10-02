import { ArrowRight } from "lucide-react";
import "./MindDumpCard.css";

function MindDumpCard() {
  return (
    <button className="mind-dump-card" type="button">
      <div className="mind-dump-card__visual" aria-hidden="true">
        <span className="mind-dump-card__steam">〰</span>
      </div>

      <div className="mind-dump-card__content">
        <h2>Svuota la mente</h2>
        <p>
          Libera i pensieri, riduci
          <br />
          il sovraccarico mentale.
        </p>
      </div>

      <span className="mind-dump-card__arrow">
        <ArrowRight size={18} strokeWidth={1.5} />
      </span>
    </button>
  );
}

export default MindDumpCard;
