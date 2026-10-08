import { useState } from "react";
import { ArrowRight } from "lucide-react";
import BottomNav from "../components/BottomNav/BottomNav";
import "./MindDumpPage.css";

function MindDumpPage() {
  const [mindDump, setMindDump] = useState("");

  const hasContent = mindDump.trim().length > 0;

  const handleOrganize = () => {
    if (!hasContent) return;

    // Più avanti qui partirà il processo di organizzazione del Mind Dump.
    console.log("Mind Dump:", mindDump);
  };

  return (
    <main className="mind-dump-page">
      <div className="mind-dump-page__container">
        <header className="mind-dump-page__header">
          <h1>Svuota la mente</h1>
          <p>Scrivi tutto quello che hai in testa. Al resto pensiamo noi.</p>
        </header>

        <textarea
          className="mind-dump-page__textarea"
          placeholder="Scrivi qui tutto quello che ti passa per la testa..."
          aria-label="Svuota i tuoi pensieri"
          value={mindDump}
          onChange={(event) => setMindDump(event.target.value)}
        />

        <button
          className="mind-dump-page__organize"
          type="button"
          disabled={!hasContent}
          onClick={handleOrganize}
        >
          <span>Metti ordine</span>
          <ArrowRight size={18} strokeWidth={1.7} />
        </button>
      </div>

      <BottomNav />
    </main>
  );
}

export default MindDumpPage;
