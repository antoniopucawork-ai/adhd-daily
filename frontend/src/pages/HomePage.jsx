import { useEffect, useState } from "react";
import { Bell, Cloud } from "lucide-react";

import { apiRequest } from "../services/api";
import { useAuth } from "../context/useAuth";
import { usePreferences } from "../context/usePreferences";

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
  const { user, token } = useAuth();

  const {
    homeModules,
    isLoading: preferencesLoading,
    error: preferencesError,
  } = usePreferences();

  // I pensieri vengono recuperati dal backend.
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMindDumps = async () => {
      if (!token) {
        setItems([]);
        setItemsLoading(false);
        return;
      }

      setItemsLoading(true);
      setItemsError("");

      try {
        // Recuperiamo i Mind Dump dell'utente autenticato.
        const mindDumps = await apiRequest("/api/mind-dumps", {
          token,
        });

        if (!Array.isArray(mindDumps)) {
          throw new Error("Il formato dei pensieri non è valido.");
        }

        // Ogni Mind Dump può contenere più elementi.
        // flatMap li riunisce in un unico array.
        const organizedItems = mindDumps.flatMap((mindDump) =>
          (mindDump.items || []).map((item) => ({
            ...item,

            // I componenti React utilizzano id.
            id: item._id,

            // Conserviamo il riferimento al pensiero originale.
            source: {
              mindDumpId: mindDump._id,
              originalText: mindDump.originalText,
            },
          })),
        );

        if (!cancelled) {
          setItems(organizedItems);
        }
      } catch (error) {
        if (!cancelled) {
          setItemsError(error.message || "Non riesco a recuperare i pensieri.");
        }
      } finally {
        if (!cancelled) {
          setItemsLoading(false);
        }
      }
    };

    loadMindDumps();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Per ora non permettiamo di completare le attività.
  // Il relativo endpoint di aggiornamento va ancora implementato.
  const handleCompleteItem = () => {
    setItemsError(
      "Il completamento delle attività sarà disponibile dopo il collegamento al database.",
    );
  };

  // Applichiamo le preferenze dell'utente.
  const visibleModules = [...homeModules]
    .filter((module) => module.enabled)
    .sort((a, b) => a.order - b.order);

  // Prepariamo i dati per ogni modulo.
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

  const isLoading = preferencesLoading || itemsLoading;
  const error = preferencesError || itemsError;

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
