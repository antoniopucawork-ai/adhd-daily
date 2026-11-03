import { useState } from "react";
import { Bell, Cloud } from "lucide-react";

import { useAuth } from "../context/useAuth";
import { usePreferences } from "../context/usePreferences";
import { useMindDumps } from "../hooks/useMindDumps";
import { apiRequest } from "../services/api";

import MindDumpCard from "../components/MindDumpCard/MindDumpCard";
import TodayList from "../components/TodayList/TodayList";
import NextStepCard from "../components/NextStepCard/NextStepCard";

import "./HomePage.css";

const moduleRegistry = {
  mindDump: MindDumpCard,
  today: TodayList,
  nextStep: NextStepCard,
};

function HomePage() {
  const { user, token } = useAuth();

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

  const [completingId, setCompletingId] = useState(null);
  const [completionError, setCompletionError] = useState("");

  async function handleCompleteItem(itemId) {
    if (completingId !== null) return;

    const item = items.find((entry) => entry.id === itemId);

    // Completiamo soltanto azioni confermate.
    if (
      !item ||
      item.type !== "ACTION" ||
      item.uncertain ||
      item.status === "DONE" ||
      !item.source?.mindDumpId
    ) {
      setCompletionError("Questa attività non può essere completata.");
      return;
    }

    setCompletingId(itemId);
    setCompletionError("");

    try {
      const response = await apiRequest(
        `/api/mind-dumps/${encodeURIComponent(
          item.source.mindDumpId,
        )}/items/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            status: "DONE",
          }),
        },
      );

      // Verifichiamo che il server abbia aggiornato
      // proprio l'elemento richiesto.
      if (
        String(response?.item?._id) !== String(item.id) ||
        response.item.status !== "DONE"
      ) {
        throw new Error("Il server non ha confermato il completamento.");
      }

      // Rileggiamo i dati dal backend.
      reload();
    } catch (error) {
      if (error.name === "AbortError" || error.status === 401) {
        return;
      }

      setCompletionError("Non riesco a completare l'attività. Riprova.");
    } finally {
      setCompletingId(null);
    }
  }

  const visibleModules = [...homeModules]
    .filter((module) => module.enabled)
    .sort((a, b) => a.order - b.order);

  const moduleProps = {
    mindDump: {},

    today: {
      items,
      onComplete: handleCompleteItem,
      completingId,
      completionError,
    },

    nextStep: {
      items,
    },
  };

  const isLoading = preferencesLoading || itemsLoading;
  const loadingError = preferencesError || itemsError;

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
      </div>
    </main>
  );
}

export default HomePage;
