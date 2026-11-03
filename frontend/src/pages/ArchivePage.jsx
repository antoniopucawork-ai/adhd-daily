import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useMindDumps } from "../hooks/useMindDumps";
import ArchiveCard from "../components/ArchiveCard";
import DeleteAllMindDumps from "../components/DeleteAllMindDumps/DeleteAllMindDumps";
import "./ArchivePage.css";

export default function ArchivePage() {
  const { token } = useAuth();
  const { dumps, items, isLoading, error, reload } = useMindDumps();
  const location = useLocation();
  const [activeCard, setActiveCard] = useState(null);

  function handleChanged() {
    setActiveCard(null);
    reload();
  }

  // Raggiungiamo l'elemento selezionato dalla Home.
  useEffect(() => {
    if (isLoading || !location.hash || error) return;

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
  }, [location.hash, error, isLoading]);

  return (
    <main className="archive-page">
      <div className="archive-page__container">
        {dumps.length > 0 && (
          <DeleteAllMindDumps
            token={token}
            dumpCount={dumps.length}
            itemCount={items.length}
            disabled={activeCard !== null}
            isOpen={activeCard === "all"}
            onOpenChange={(open) => setActiveCard(open ? "all" : null)}
            onDeleted={handleChanged}
          />
        )}
        <header className="archive-page__header">
          <Link className="archive-page__back" to="/">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Home</span>
          </Link>

          <h1>Archivio</h1>

          <p>Ritrova ciò che hai salvato, anche senza una data.</p>
        </header>

        {isLoading ? (
          <div className="archive-page__message">
            <p>Caricamento dei tuoi elementi...</p>
          </div>
        ) : error ? (
          <div className="archive-page__message">
            <p role="alert">{error}</p>

            <button
              className="archive-page__retry"
              type="button"
              onClick={reload}
            >
              Riprova
            </button>
          </div>
        ) : dumps.length === 0 ? (
          <div className="archive-page__message">
            <p>Non hai ancora salvato Mind Dump.</p>

            <Link className="archive-page__empty-link" to="/svuota">
              Svuota la mente
            </Link>
          </div>
        ) : (
          <ul className="archive-page__list">
            {dumps.map((dump) => {
              const renderCard = (item) => {
                const id = item ? `item-${item._id}` : `dump-${dump._id}`;
                return (
                  <ArchiveCard
                    key={id}
                    id={id}
                    dump={dump}
                    item={item}
                    token={token}
                    disabled={activeCard !== null && activeCard !== id}
                    onActiveChange={(open) => setActiveCard(open ? id : null)}
                    onChanged={handleChanged}
                  />
                );
              };
              return dump.items?.length ? dump.items.map(renderCard) : renderCard(null);
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
