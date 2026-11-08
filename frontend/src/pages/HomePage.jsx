import { useState } from "react";

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

  const moduleProps = {
    mindDump: {},

    today: {
      items,
      onComplete: handleCompleteFromPanel,
      onOpenItem: handleOpenItem,
      completingId,
      completionError,
    },

    nextStep: {
      items,
      onOpenItem: handleOpenItem,
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
