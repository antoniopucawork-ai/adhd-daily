import { useState } from "react";
import { Bell, Cloud } from "lucide-react";
import "./HomePage.css";

import MindDumpCard from "../components/MindDumpCard/MindDumpCard";
import TodayList from "../components/TodayList/TodayList";
import NextStepCard from "../components/NextStepCard/NextStepCard";
import BottomNav from "../components/BottomNav/BottomNav";

function HomePage() {
  const [items, setItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem("adhdDailyItems");

      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error("Errore durante la lettura degli elementi salvati:", error);

      return [];
    }
  });

  const handleCompleteItem = (itemId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            status: "DONE",
          }
        : item,
    );

    setItems(updatedItems);

    localStorage.setItem("adhdDailyItems", JSON.stringify(updatedItems));
  };

  return (
    <main className="home">
      <div className="home__container">
        <header className="home__header">
          <div className="home__brand">
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
          <p>Facciamo una cosa alla volta ♡</p>
        </section>

        <MindDumpCard />

        <TodayList items={items} onComplete={handleCompleteItem} />

        <NextStepCard items={items} />

        <BottomNav />
      </div>
    </main>
  );
}

export default HomePage;
