import { useState } from "react";
import { ArrowRight } from "lucide-react";
import BottomNav from "../components/BottomNav/BottomNav";
import MindDumpResult from "../components/MindDumpResult/MindDumpResult";
import MindDumpEdit from "../components/MindDumpEdit/MindDumpEdit";
import "./MindDumpPage.css";

function MindDumpPage() {
  const [mindDump, setMindDump] = useState("");
  const [result, setResult] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const hasContent = mindDump.trim().length > 0;

  const handleOrganize = () => {
    if (!hasContent) return;

    // MOCK TEMPORANEO:
    // In futuro questo risultato arriverà dal backend + AI.
    const mockResult = {
      originalText: mindDump,

      items: [
        {
          id: crypto.randomUUID(),
          type: "ACTION",
          title: "Chiamare il dentista",
          date: "2026-10-09",
          time: null,
          deadline: null,
          reminder: false,
          people: [],
          explicit: true,
          confidence: 0.98,
          requiresConfirmation: false,
        },
      ],
    };

    setResult(mockResult);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
  };

  const handleSaveItem = (updatedItem) => {
    setResult((currentResult) => ({
      ...currentResult,

      items: currentResult.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    }));

    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleConfirm = () => {
    if (!result) return;

    const savedItems = JSON.parse(
      localStorage.getItem("adhdDailyItems") || "[]",
    );

    const confirmedItems = result.items.map((item) => ({
      ...item,
      status: "TODO",
      confirmed: true,
    }));

    localStorage.setItem(
      "adhdDailyItems",
      JSON.stringify([...savedItems, ...confirmedItems]),
    );

    setMindDump("");
    setResult(null);
    setEditingItem(null);
  };

  const handleBack = () => {
    setResult(null);
    setEditingItem(null);
  };

  return (
    <main className="mind-dump-page">
      <div className="mind-dump-page__container">
        {!result ? (
          <>
            <header className="mind-dump-page__header">
              <h1>Svuota la mente</h1>

              <p>
                Scrivi tutto quello che hai in testa. Al resto pensiamo noi.
              </p>
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
          </>
        ) : editingItem ? (
          <MindDumpEdit
            item={editingItem}
            onSave={handleSaveItem}
            onCancel={handleCancelEdit}
          />
        ) : (
          <MindDumpResult
            result={result}
            onBack={handleBack}
            onEdit={handleEditItem}
            onConfirm={handleConfirm}
          />
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default MindDumpPage;
