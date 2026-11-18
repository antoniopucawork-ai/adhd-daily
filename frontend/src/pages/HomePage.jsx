import { useState } from "react";
import { Link } from "react-router-dom";
import { getTodayDate } from "../utils/date";
import { getNextAction } from "../utils/organizeItems";

import { useAuth } from "../context/useAuth";
import { usePreferences } from "../context/usePreferences";
import { useMindDumps } from "../hooks/useMindDumps";
import { useMindDumpItemActions } from "../hooks/useMindDumpItemActions";

import MindDumpCard from "../components/MindDumpCard/MindDumpCard";
import TodayList from "../components/TodayList/TodayList";
import NextStepCard from "../components/NextStepCard/NextStepCard";
import EditableItemQuickPanel from "../components/ItemQuickPanel/EditableItemQuickPanel";

import adhdDailySymbol from "../assets/adhd-daily-symbol.svg";

import "./HomePage.css";

const moduleRegistry = {
  mindDump: MindDumpCard,
  today: TodayList,
  nextStep: NextStepCard,
};

function HomePage() {
  const { user } = useAuth();

  const {
    homeModules,
    isLoading: preferencesLoading,
    error: preferencesError,
  } = usePreferences();

  const {
    items,
    reload,
    isLoading: itemsLoading,
    error: itemsError,
  } = useMindDumps();

  const [selectedItem, setSelectedItem] = useState(null);

  const { completeItem, completingId, completionError, clearCompletionError } =
    useMindDumpItemActions({ items, reload });

  async function handleCompleteFromPanel(itemId) {
    const completed = await completeItem(itemId);

    if (completed) {
      setSelectedItem((current) => (current?.id === itemId ? null : current));
    }
  }

  function handleOpenItem(item) {
    clearCompletionError();
    setSelectedItem(item);
  }

  // Ordine e visibilità dei moduli scelti dall'utente.
  const visibleModules = [...homeModules]
    .filter((module) => module.enabled)
    .sort((a, b) => a.order - b.order);

  // La stessa azione guida la card e l'esclusione dall'elenco Oggi.
  const nextAction = getNextAction(items, getTodayDate());
  const highlightedActionId = visibleModules.some((module) => module.id === "nextStep")
    ? nextAction?.id
    : null;

  const moduleProps = {
    mindDump: {},

    today: {
      items,
      highlightedActionId,
      onComplete: handleCompleteFromPanel,
      onOpenItem: handleOpenItem,
      completingId,
      completionError,
    },

    nextStep: {
      nextItem: nextAction,
      onOpenItem: handleOpenItem,
      onComplete: handleCompleteFromPanel,
      completingId,
      completionError,
    },
  };

  const isLoading = preferencesLoading || itemsLoading;
  const loadingError = preferencesError || itemsError;

  return (
    <main className="home">
      <div className="home__container">
        {/* Intestazione mobile con logo ADHD Daily */}
        <header className="home__header">
          <div className="home__brand">
            <img
              src={adhdDailySymbol}
              alt=""
              aria-hidden="true"
              className="home__brand-logo"
            />
            <span>ADHD Daily</span>
          </div>
        </header>

        {/* Benvenuto */}
        <section className="home__welcome">
          <h1>Ciao {user?.firstName || "!"}</h1>
          <p>Facciamo una cosa alla volta.</p>
        </section>

        {/* Dashboard personalizzabile */}
        {isLoading ? (
          <p>Prepariamo il tuo spazio...</p>
        ) : loadingError ? (
          <p role="alert" className="home__error">
            {loadingError}
          </p>
        ) : visibleModules.length === 0 ? (
          <div className="home__empty glass-surface">
            <p>Hai nascosto tutti i moduli della Home</p>
            <Link to="/impostazioni">Personalizza la Home</Link>
          </div>
        ) : (
          <div className="home__dashboard">
            {visibleModules.map((module) => {
              const Component = moduleRegistry[module.id];

              if (!Component) return null;

              return <Component key={module.id} {...moduleProps[module.id]} />;
            })}
          </div>
        )}

        {/* Pannello delle azioni sugli elementi */}
        {selectedItem && (
          <EditableItemQuickPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            reload={reload}
            onComplete={handleCompleteFromPanel}
            isCompleting={completingId !== null}
            completionError={completionError}
          />
        )}
      </div>
    </main>
  );
}

export default HomePage;
