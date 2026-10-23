import { useState } from "react";
import { Bell, Cloud } from "lucide-react";
import "./HomePage.css";

import { useAuth } from "../context/useAuth";
import { usePreferences } from "../context/usePreferences";

import MindDumpCard from "../components/MindDumpCard/MindDumpCard";
import TodayList from "../components/TodayList/TodayList";
import NextStepCard from "../components/NextStepCard/NextStepCard";
import BottomNav from "../components/BottomNav/BottomNav";

// Qui colleghiamo ogni modulo al suo componente.
// In questo modo possiamo decidere quali mostrare
// senza doverli inserire tutti manualmente nella Home.
const moduleRegistry = {
  mindDump: MindDumpCard,
  today: TodayList,
  nextStep: NextStepCard,
};

function HomePage() {
  // Recuperiamo l'utente che ha effettuato il login.
  const { user } = useAuth();

  // Recuperiamo le preferenze salvate su MongoDB.
  const { homeModules, isLoading, error } = usePreferences();

  // Qui gestiamo eventuali errori nel salvataggio delle attività.
  const [saveError, setSaveError] = useState("");

  // Per ora recuperiamo le attività dal localStorage.
  // Più avanti le collegheremo al database dell'utente.
  const [items, setItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem("adhdDailyItems");

      if (!savedItems) {
        return [];
      }

      const parsedItems = JSON.parse(savedItems);

      return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
      console.error("Errore durante la lettura degli elementi:", error);
      return [];
    }
  });

  // Quando completiamo un'attività, aggiorniamo il suo stato.
  // Prima salviamo la modifica e poi aggiorniamo la Home.
  const handleCompleteItem = (itemId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            status: "DONE",
          }
        : item,
    );

    try {
      localStorage.setItem("adhdDailyItems", JSON.stringify(updatedItems));
      setItems(updatedItems);
      setSaveError("");
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);

      setSaveError(
        "Non sono riuscito a salvare la modifica. Riprova tra poco.",
      );
    }
  };

  // Qui applichiamo la personalizzazione della Home.
  // Togliamo i moduli disattivati e ordiniamo quelli rimasti
  // in base alla posizione scelta dall'utente.
  const visibleModules = [...homeModules]
    .filter((module) => module.enabled)
    .sort((a, b) => a.order - b.order);

  // Ogni modulo ha bisogno di dati diversi.
  // Qui prepariamo quelli che gli servono per funzionare.
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

        {/* Mostriamo il nome dell'utente che ha effettuato il login. */}
        <section className="home__welcome">
          <h1>Ciao {user?.firstName || "!"}</h1>
          <p>Facciamo una cosa alla volta.</p>
        </section>

        {/* Se il salvataggio di un'attività fallisce, mostriamo l'errore. */}
        {saveError && (
          <p role="alert" className="home__error">
            {saveError}
          </p>
        )}

        {/* Prima aspettiamo le preferenze dell'utente.
            Se qualcosa va storto mostriamo un errore,
            altrimenti carichiamo la sua Home personalizzata. */}
        {isLoading ? (
          <p>Prepariamo il tuo spazio...</p>
        ) : error ? (
          <p role="alert" className="home__error">
            {error}
          </p>
        ) : (
          <div className="home__dashboard">
            {/* Creiamo soltanto i moduli attivi,
                rispettando l'ordine salvato dall'utente. */}
            {visibleModules.map((module) => {
              const Component = moduleRegistry[module.id];

              // Se il modulo non esiste, lo ignoriamo.
              if (!Component) return null;

              return <Component key={module.id} {...moduleProps[module.id]} />;
            })}
          </div>
        )}

        {/* La navigazione rimane sempre disponibile. */}
        <BottomNav />
      </div>
    </main>
  );
}

export default HomePage;
