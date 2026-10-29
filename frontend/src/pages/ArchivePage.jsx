import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";

import BottomNav from "../components/BottomNav/BottomNav";
import "./ArchivePage.css";

const TYPE_LABELS = {
  ACTION: "Da fare",
  EVENT: "Evento",
  MEMORY: "Da ricordare",
  INTENTION: "Idea",
  THOUGHT: "Pensiero",
};

// Formatta le date in italiano.
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
  const { token } = useAuth();
  const location = useLocation();

  const [savedData, setSavedData] = useState({
    items: [],
    error: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Recupera i Mind Dump dell'utente dal backend.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadMindDumps() {
      setIsLoading(true);

      try {
        const mindDumps = await apiRequest("/api/mind-dumps", {
          token,
        });

        if (!Array.isArray(mindDumps)) {
          throw new Error("Formato dei dati non valido.");
        }

        // Ogni Mind Dump contiene più elementi.
        // flatMap li unisce in un unico elenco.
        const items = mindDumps.flatMap((mindDump) =>
          (mindDump.items || []).map((item) => ({
            ...item,
            id: item._id,
            source: {
              originalText: mindDump.originalText,
            },
          })),
        );

        if (!cancelled) {
          setSavedData({
            items,
            error: "",
          });
        }
      } catch (error) {
        console.error("Errore caricamento archivio:", error);

        if (!cancelled) {
          setSavedData({
            items: [],
            error:
              "Non riesco a caricare gli elementi salvati. Riprova tra poco.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMindDumps();

    return () => {
      cancelled = true;
    };
  }, [token, retryCount]);

  // Porta l'utente all'elemento selezionato dalla Home.
  useEffect(() => {
    if (isLoading || !location.hash || savedData.error) return;

    let itemId;

    try {
      itemId = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }

    const element = document.getElementById(itemId);

    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [location.hash, savedData, isLoading]);

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

        {isLoading ? (
          <div className="archive-page__message">
            <p>Caricamento dei tuoi elementi...</p>
          </div>
        ) : savedData.error ? (
          <div className="archive-page__message">
            <p role="alert">{savedData.error}</p>

            <button
              className="archive-page__retry"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
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
                <li
                  className="archive-page__card"
                  key={item.id}
                  id={`item-${item.id}`}
                >
                  <div className="archive-page__card-header">
                    <span className="archive-page__type">{typeLabel}</span>

                    {item.status === "DONE" && (
                      <span className="archive-page__done">Completato</span>
                    )}

                    {item.uncertain && (
                      <span className="archive-page__type">Da confermare</span>
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
