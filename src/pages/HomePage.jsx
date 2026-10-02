import { Bell, Cloud } from "lucide-react";
import "./HomePage.css";
import MindDumpCard from "../components/MindDumpCard/MindDumpCard";
import TodayList from "../components/TodayList/TodayList";
import NextStepCard from "../components/NextStepCard/NextStepCard";
import BottomNav from "../components/BottomNav/BottomNav";
function HomePage() {
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
        <TodayList />
        <NextStepCard />
        <BottomNav />
      </div>
    </main>
  );
}

export default HomePage;
