import { useState } from "react";
import { Bell, Cloud } from "lucide-react";

import { useAuth } from "../context/useAuth";
import { usePreferences } from "../context/usePreferences";
import { useMindDumps } from "../hooks/useMindDumps";

import MindDumpCard from "../components/MindDumpCard/MindDumpCard";
import TodayList from "../components/TodayList/TodayList";
import NextStepCard from "../components/NextStepCard/NextStepCard";
import BottomNav from "../components/BottomNav/BottomNav";

import "./HomePage.css";

// Associa ogni modulo al relativo componente React.
const moduleRegistry = {
  mindDump: MindDumpCard,
  today: TodayList,
  nextStep: NextStepCard,
};

function HomePage() {
  const { user } = useAuth();

  // Recuperiamo le preferenze dell'utente.
  const {
    homeModules,
    isLoading: preferencesLoading,
    error: preferencesError,
  } = usePreferences();

  // Recuperiamo i pensieri attraverso il nostro custom hook.
  const { items, isLoading: itemsLoading, error: itemsError } = useMindDumps();

  // Messaggio temporaneo per il completamento delle attività.
  const [completionError, setCompletionError] = useState("");

  // Per ora non permettiamo di completare le attività.
  // Implementeremo questa funzione quando avremo l'endpoint PATCH.
  const handleCompleteItem = () => {
    setCompletionError(
      "Il completamento delle attività sarà disponibile dopo il collegamento al database.",
    );
  };

  // Applichiamo le preferenze dell'utente.
  const visibleModules = [...homeModules]
    .filter((module) => module.enabled)
    .sort((a, b) => a.order - b.order);

  // Prepariamo i dati necessari a ogni modulo.
  const moduleProps = {
    mindDump: {},

    today: {
      items,
      onComplete: handleCompleteItem,
    },

    nextStep: {
      items,
    },
  };

  // Gestiamo caricamento ed eventuali errori.
  const isLoading = preferencesLoading || itemsLoading;
  const error = preferencesError || itemsError || completionError;

  return (
    <main className="home">
      <div className="home__container">
        <header className="home__header">
          <div className="home__brand home__brand--mobile">
            <Cloud size={18} strokeWidth={1.5} />
            <span>ADHD Daily</span>
          </div>

          <button
            className="home__notification"
            type="button"
            aria-label="Apri le notifiche"
          >
            <Bell size={19} strokeWidth={1.5} />
          </button>
        </header>

        <section className="home__welcome">
          <h1>Ciao {user?.firstName || "!"}</h1>
          <p>Facciamo una cosa alla volta.</p>
        </section>

        {isLoading ? (
          <p>Prepariamo il tuo spazio...</p>
        ) : error ? (
          <p role="alert" className="home__error">
            {error}
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

        <BottomNav />
      </div>
    </main>
  );
}

export default HomePage;
