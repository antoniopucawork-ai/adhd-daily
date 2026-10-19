import { useState } from "react";
import { Bell, Cloud } from "lucide-react";
import "./HomePage.css";

import MindDumpCard from "../components/MindDumpCard/MindDumpCard";
import TodayList from "../components/TodayList/TodayList";
import NextStepCard from "../components/NextStepCard/NextStepCard";
import BottomNav from "../components/BottomNav/BottomNav";

function HomePage() {
  // Gestione degli errori di salvataggio
  const [saveError, setSaveError] = useState("");

  // Recuperiamo le attività salvate nel browser
  const [items, setItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem("adhdDailyItems");

      if (!savedItems) {
        return [];
      }

      const parsedItems = JSON.parse(savedItems);

      return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
      console.error("Errore durante la lettura degli elementi salvati:", error);

      return [];
    }
  });

  // Completiamo un'attività
  const handleCompleteItem = (itemId) => {
    // Creiamo una nuova lista aggiornando l'attività selezionata
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            status: "DONE",
          }
        : item,
    );

    try {
      // Prima salviamo i dati nel browser
      localStorage.setItem("adhdDailyItems", JSON.stringify(updatedItems));

      // Aggiorniamo React soltanto se il salvataggio riesce
      setItems(updatedItems);

      // Eliminiamo eventuali messaggi di errore precedenti
      setSaveError("");
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);

      // Informiamo l'utente senza modificare la lista
      setSaveError(
        "Non sono riuscito a salvare la modifica. Riprova tra poco.",
      );
    }
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

        <section className="home__welcome">
          <h1>Ciao Antonio</h1>
          <p>Facciamo una cosa alla volta.</p>
        </section>

        {/* Mostriamo un messaggio se il salvataggio fallisce */}
        {saveError && (
          <p role="alert" className="home__error">
            {saveError}
          </p>
        )}

        <div className="home__dashboard">
          <MindDumpCard />

          <TodayList items={items} onComplete={handleCompleteItem} />

          <NextStepCard items={items} />
        </div>

        <BottomNav />
      </div>
    </main>
  );
}

export default HomePage;
