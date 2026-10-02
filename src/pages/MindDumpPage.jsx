import BottomNav from "../components/BottomNav/BottomNav";
import "./MindDumpPage.css";

function MindDumpPage() {
  return (
    <main className="mind-dump-page">
      <div className="mind-dump-page__container">
        <header className="mind-dump-page__header">
          <h1>Svuota la mente</h1>
          <p>Scrivi tutto quello che hai in testa. Ci pensiamo insieme.</p>
        </header>

        <textarea
          className="mind-dump-page__textarea"
          placeholder="Scrivi qui tutto quello che ti passa per la testa..."
          aria-label="Svuota i tuoi pensieri"
        />
      </div>

      <BottomNav />
    </main>
  );
}

export default MindDumpPage;
