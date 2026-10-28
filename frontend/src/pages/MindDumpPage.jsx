import { useState } from "react";
import { ArrowRight } from "lucide-react";

import BottomNav from "../components/BottomNav/BottomNav";
import MindDumpResult from "../components/MindDumpResult/MindDumpResult";
import MindDumpEdit from "../components/MindDumpEdit/MindDumpEdit";

import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";

import "./MindDumpPage.css";

const DRAFT_KEY = "adhdDailyDraft";

// Recuperiamo la bozza salvata nel browser
function readDraft() {
  try {
    return {
      text: localStorage.getItem(DRAFT_KEY) || "",
      error: "",
    };
  } catch {
    return {
      text: "",
      error: "Non riesco a recuperare la bozza.",
    };
  }
}

function MindDumpPage() {
  const { token } = useAuth();

  const [draft, setDraft] = useState(readDraft);
  const [result, setResult] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const mindDump = draft.text;
  const hasContent = mindDump.trim().length > 0;

  // Aggiorniamo il testo e salviamo la bozza
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
      error = "Non riesco a salvare la bozza nel browser.";
    }

    setDraft({
      text,
      error,
    });
  };

  // Inviamo il testo al backend per farlo analizzare da Gemini
  const handleOrganize = async () => {
    if (!hasContent || isAnalyzing) return;

    setSaveError("");
    setIsAnalyzing(true);

    try {
      const analysis = await apiRequest("/api/mind-dumps/analyze", {
        method: "POST",
        token,
        body: JSON.stringify({
          originalText: mindDump,
        }),
      });

      if (!Array.isArray(analysis.items)) {
        throw new Error("La risposta dell'IA non è valida.");
      }

      const organizedResult = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        originalText: mindDump,

        items: analysis.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          reminder: false,
        })),
      };

      setResult(organizedResult);
    } catch (error) {
      setSaveError(
        error.message || "Non sono riuscito ad analizzare il testo.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apriamo la modifica di un elemento
  const handleEditItem = (item) => {
    setEditingItem(item);
  };

  // Salviamo le modifiche effettuate dall'utente
  const handleSaveItem = (updatedItem) => {
    setResult((currentResult) => ({
      ...currentResult,

      items: currentResult.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    }));

    setEditingItem(null);
  };

  // Annulliamo la modifica
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  // Salviamo gli elementi confermati in MongoDB
  // Eliminiamo la bozza solo dopo il salvataggio riuscito
  const handleConfirm = async () => {
    if (!result || isSaving) return;

    setSaveError("");
    setIsSaving(true);

    try {
      const response = await apiRequest("/api/mind-dumps", {
        method: "POST",
        token,
        body: JSON.stringify({
          originalText: result.originalText,
          items: result.items.map((item) => ({
            type: item.type,
            title: item.title,
            date: item.date ?? null,
            time: item.time ?? null,
            uncertain: item.uncertain ?? false,
          })),
        }),
      });

      if (!response.mindDump?._id) {
        throw new Error("Il server non ha confermato il salvataggio.");
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Il pensiero è già stato salvato in MongoDB.
      }

      setDraft({ text: "", error: "" });
      setResult(null);
      setEditingItem(null);
    } catch (error) {
      setSaveError(error.message || "Non sono riuscito a salvare il pensiero.");
    } finally {
      setIsSaving(false);
    }
  };

  // Torniamo al testo originale
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
              disabled={isAnalyzing}
            />

            <button
              className="mind-dump-page__organize"
              type="button"
              disabled={!hasContent || isAnalyzing}
              onClick={handleOrganize}
            >
              <span>
                {isAnalyzing ? "Sto mettendo ordine..." : "Metti ordine"}
              </span>

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
            isSaving={isSaving}
          />
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default MindDumpPage;
