import { useState } from "react";
import { ArrowRight } from "lucide-react";
import BottomNav from "../components/BottomNav/BottomNav";
import MindDumpResult from "../components/MindDumpResult/MindDumpResult";
import MindDumpEdit from "../components/MindDumpEdit/MindDumpEdit";
import { getTodayDate } from "../utils/date";
import "./MindDumpPage.css";

const DRAFT_KEY = "adhdDailyDraft";
const ITEMS_KEY = "adhdDailyItems";

function readDraft() {
  try {
    return {
      text: localStorage.getItem(DRAFT_KEY) || "",
      error: "",
    };
  } catch {
    return {
      text: "",
      error:
        "Non riesco a recuperare la bozza. Il salvataggio nel browser potrebbe non essere disponibile.",
    };
  }
}

function MindDumpPage() {
  const [draft, setDraft] = useState(readDraft);
  const [result, setResult] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [saveError, setSaveError] = useState("");

  const mindDump = draft.text;
  const hasContent = mindDump.trim().length > 0;

  const handleMindDumpChange = (event) => {
    const text = event.target.value;
    let error = "";

    try {
      if (text.length > 0) {
        localStorage.setItem(DRAFT_KEY, text);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      error = "Non riesco a salvare la bozza. Copia il testo prima di uscire.";
    }

    // Il testo rimane scrivibile anche se il salvataggio fallisce.
    setDraft({ text, error });
  };

  const handleOrganize = () => {
    if (!hasContent) return;

    setSaveError("");

    // MOCK TEMPORANEO:
    // Non interpreta ancora il testo.
    // In futuro il risultato arriverà dal backend + AI.
    const mockResult = {
      originalText: mindDump,
      items: [
        {
          id: crypto.randomUUID(),
          type: "ACTION",
          title: mindDump.trim(),
          date: getTodayDate(),
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

    setSaveError("");

    try {
      const savedItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || "[]");

      // Evita di sovrascrivere dati con una struttura inattesa.
      if (!Array.isArray(savedItems)) {
        setSaveError(
          "I dati salvati non sono leggibili. Il testo resta qui: copia il contenuto prima di uscire.",
        );
        return;
      }

      const confirmedItems = result.items.map((item) => ({
        ...item,
        status: "TODO",
        confirmed: true,
      }));

      localStorage.setItem(
        ITEMS_KEY,
        JSON.stringify([...savedItems, ...confirmedItems]),
      );
    } catch {
      setSaveError(
        "Non sono riuscito a salvare. Il testo resta qui: puoi riprovare o tornare indietro per copiarlo.",
      );
      return;
    }

    // Elimina la bozza soltanto dopo aver salvato le attività.
    let draftError = "";

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      draftError =
        "Le attività sono state salvate, ma non riesco a eliminare la bozza. Se ricompare, non confermarla di nuovo.";
    }

    setDraft({ text: "", error: draftError });
    setResult(null);
    setEditingItem(null);
  };

  const handleBack = () => {
    setResult(null);
    setEditingItem(null);
    setSaveError("");
  };

  return (
    <main className="mind-dump-page">
      <div className="mind-dump-page__container">
        {draft.error && <p role="alert">{draft.error}</p>}
        {saveError && <p role="alert">{saveError}</p>}

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
              onChange={handleMindDumpChange}
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
