import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../components/BottomNav/BottomNav";
import "./ArchivePage.css";

const TYPE_LABELS = {
  ACTION: "Da fare",
  EVENT: "Evento",
  MEMORY: "Da ricordare",
  INTENTION: "Idea",
};

function readSavedItems() {
  try {
    const items = JSON.parse(localStorage.getItem("adhdDailyItems") || "[]");

    const valid =
      Array.isArray(items) &&
      items.every(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          (typeof item.id === "string" ||
            (typeof item.id === "number" && Number.isFinite(item.id))) &&
          typeof item.title === "string",
      );

    if (!valid) {
      return {
        items: [],
        error: "Non riesco a leggere gli elementi salvati.",
      };
    }

    return {
      // Mostra prima gli ultimi elementi aggiunti.
      items: [...items].reverse(),
      error: "",
    };
  } catch {
    return {
      items: [],
      error: "Non riesco ad accedere agli elementi salvati. Riprova tra poco.",
    };
  }
}

function formatDate(value) {
  if (!value) return "Senza data";

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "Data non valida";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Data non valida";
  }

  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArchivePage() {
  const [savedData, setSavedData] = useState(readSavedItems);

  return (
    <main className="archive-page">
      <div className="archive-page__container">
        <header className="archive-page__header">
          <Link className="archive-page__back" to="/">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Home</span>
          </Link>

          <h1>Tutti gli elementi</h1>
          <p>Ritrova ciò che hai salvato, anche senza una data.</p>
        </header>

        {savedData.error ? (
          <div className="archive-page__message">
            <p role="alert">{savedData.error}</p>

            <button
              className="archive-page__retry"
              type="button"
              onClick={() => setSavedData(readSavedItems())}
            >
              Riprova
            </button>
          </div>
        ) : savedData.items.length === 0 ? (
          <div className="archive-page__message">
            <p>Non hai ancora salvato elementi.</p>

            <Link className="archive-page__empty-link" to="/svuota">
              Svuota la mente
            </Link>
          </div>
        ) : (
          <ul className="archive-page__list">
            {savedData.items.map((item) => {
              const originalText = item.source?.originalText;
              const hasOriginal =
                typeof originalText === "string" && originalText.length > 0;

              const typeLabel =
                typeof item.type === "string"
                  ? TYPE_LABELS[item.type] || "Elemento"
                  : "Elemento";

              return (
                <li className="archive-page__card" key={item.id}>
                  <div className="archive-page__card-header">
                    <span className="archive-page__type">{typeLabel}</span>

                    {item.status === "DONE" && (
                      <span className="archive-page__done">Completato</span>
                    )}
                  </div>

                  <h2>{item.title}</h2>

                  <p className="archive-page__date">
                    {formatDate(item.date)}

                    {typeof item.time === "string" && item.time
                      ? ` · ${item.time}`
                      : ""}
                  </p>

                  {hasOriginal ? (
                    <details className="archive-page__source">
                      <summary>Testo originale</summary>
                      <p>{originalText}</p>
                    </details>
                  ) : (
                    <p className="archive-page__missing-source">
                      Testo originale non disponibile per questo elemento.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default ArchivePage;
