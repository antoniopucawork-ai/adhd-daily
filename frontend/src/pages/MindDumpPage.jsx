import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Feather, LoaderCircle } from "lucide-react";

import BottomNav from "../components/BottomNav/BottomNav";
import MindDumpResult from "../components/MindDumpResult/MindDumpResult";
import MindDumpEdit from "../components/MindDumpEdit/MindDumpEdit";

import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";

import "./MindDumpPage.css";

const MAX_TEXT_LENGTH = 10000;
const MAX_ITEMS = 20;
const MAX_TITLE_LENGTH = 200;

// Ogni account usa una chiave diversa per la propria bozza.
function getDraftKey(userId) {
  return userId ? `adhdDailyDraft:${userId}` : null;
}

// Recuperiamo la bozza dal browser quando apriamo la pagina.
function readDraft(key) {
  if (!key) {
    return { text: "", error: "" };
  }

  try {
    return {
      text: localStorage.getItem(key) || "",
      error: "",
    };
  } catch {
    return {
      text: "",
      error: "Non riesco a recuperare la bozza dal browser.",
    };
  }
}

function MindDumpPage() {
  const { token, user } = useAuth();
  const draftKey = getDraftKey(user?.id);

  const [draft, setDraft] = useState(() => readDraft(draftKey));
  const [result, setResult] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mindDump = draft.text;
  const hasContent = mindDump.trim().length > 0;

  // Aggiorniamo il testo e conserviamo la bozza nel browser.
  function handleMindDumpChange(event) {
    const text = event.target.value;

    let draftError = "";

    try {
      if (draftKey) {
        if (text.length > 0) {
          localStorage.setItem(draftKey, text);
        } else {
          localStorage.removeItem(draftKey);
        }
      } else {
        draftError = "Non riesco a identificare la bozza dell'utente.";
      }
    } catch {
      draftError = "Non riesco a salvare la bozza nel browser.";
    }

    setDraft({ text, error: draftError });
    setError("");
    setSuccessMessage("");
  }

  // Analizziamo il testo senza salvarlo nel database.
  async function handleOrganize(event) {
    event.preventDefault();

    if (!hasContent || isAnalyzing || isSaving) return;

    setError("");
    setSuccessMessage("");
    setIsAnalyzing(true);

    try {
      const analysis = await apiRequest("/api/mind-dumps/analyze", {
        method: "POST",
        token,
        body: JSON.stringify({
          originalText: mindDump,
        }),
      });

      // Il backend accetta al massimo 20 elementi al salvataggio.
      if (!Array.isArray(analysis?.items) || analysis.items.length === 0) {
        throw new Error("Non sono riuscito a interpretare il testo. Riprova.");
      }

      if (analysis.items.length > MAX_ITEMS) {
        throw new Error(
          "Il testo contiene troppi elementi. Prova a dividerlo in due parti.",
        );
      }

      const validTypes = ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"];

      const isValidResult = analysis.items.every(
        (item) =>
          item &&
          validTypes.includes(item.type) &&
          typeof item.title === "string" &&
          item.title.trim().length > 0,
      );

      if (!isValidResult) {
        throw new Error(
          "La risposta non è completa. Il testo è rimasto salvato come bozza.",
        );
      }

      setResult({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        originalText: mindDump,
        items: analysis.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        })),
      });
    } catch (requestError) {
      setError(
        requestError.message || "Non sono riuscito ad analizzare il pensiero.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Apriamo la modifica del pensiero selezionato.
  function handleEditItem(item) {
    setError("");
    setEditingItem(item);
  }

  // Aggiorniamo l'elemento prima della conferma definitiva.
  function handleSaveItem(updatedItem) {
    setResult((current) => {
      if (!current) return current;

      return {
        ...current,
        items: current.items.map((item) =>
          item.id === updatedItem.id ? updatedItem : item,
        ),
      };
    });

    setEditingItem(null);
  }

  // Salviamo in MongoDB solo dopo la conferma dell'utente.
  async function handleConfirm() {
    if (!result || isSaving) return;

    const hasInvalidTitles = result.items.some(
      (item) => !item.title.trim() || item.title.length > MAX_TITLE_LENGTH,
    );

    if (hasInvalidTitles) {
      setError("Controlla i titoli: devono contenere massimo 200 caratteri.");
      return;
    }

    setError("");
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

      if (!response?.mindDump?._id) {
        throw new Error("Il server non ha confermato il salvataggio.");
      }

      let draftError = "";

      // Cancelliamo la bozza soltanto dopo il salvataggio riuscito.
      try {
        if (draftKey) {
          localStorage.removeItem(draftKey);
        }
      } catch {
        draftError =
          "Il pensiero è salvato, ma non sono riuscito a cancellare la bozza dal browser.";
      }

      setDraft({ text: "", error: draftError });
      setResult(null);
      setEditingItem(null);
      setSuccessMessage("Il tuo pensiero è stato salvato.");
    } catch (requestError) {
      setError(
        requestError.message || "Non sono riuscito a salvare il pensiero.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Torniamo al testo originale senza perdere la bozza.
  function handleBack() {
    setResult(null);
    setEditingItem(null);
    setError("");
  }

  return (
    <main className="mind-dump-page">
      <div className="mind-dump-page__container">
        {draft.error && (
          <p className="mind-dump-page__alert" role="alert">
            {draft.error}
          </p>
        )}

        {error && (
          <p className="mind-dump-page__alert" role="alert">
            {error}
          </p>
        )}

        {!result ? (
          <>
            <header className="mind-dump-page__header">
              <p className="mind-dump-page__eyebrow">Il tuo spazio</p>

              <h1>Svuota la mente</h1>

              <p className="mind-dump-page__description">
                Non devi mettere ordine nei pensieri prima di scriverli.
              </p>
            </header>

            {successMessage && (
              <div className="mind-dump-page__success" role="status">
                <p>{successMessage}</p>

                <div className="mind-dump-page__success-links">
                  <Link to="/organizza">Vai a Organizza</Link>

                  <Link to="/archivio">Apri Archivio</Link>
                </div>
              </div>
            )}

            <form className="mind-dump-page__form" onSubmit={handleOrganize}>
              <div className="mind-dump-page__sheet">
                <div className="mind-dump-page__sheet-top">
                  <span>Uno spazio solo tuo</span>

                  <Feather size={19} strokeWidth={1.5} aria-hidden="true" />
                </div>

                <textarea
                  id="mind-dump-text"
                  className="mind-dump-page__textarea"
                  placeholder="Scrivi quello che ti passa per la mente..."
                  aria-label="Scrivi i tuoi pensieri"
                  aria-describedby="mind-dump-hint"
                  value={mindDump}
                  onChange={handleMindDumpChange}
                  maxLength={MAX_TEXT_LENGTH}
                  disabled={isAnalyzing}
                />

                <div className="mind-dump-page__sheet-bottom">
                  <span id="mind-dump-hint">Nessun ordine necessario.</span>

                  {mindDump.length >= 9000 && (
                    <span className="mind-dump-page__counter">
                      {mindDump.length}/{MAX_TEXT_LENGTH}
                    </span>
                  )}
                </div>
              </div>

              <div className="mind-dump-page__actions">
                <button
                  className="mind-dump-page__organize"
                  type="submit"
                  disabled={!hasContent || isAnalyzing}
                  aria-busy={isAnalyzing}
                >
                  <span>
                    {isAnalyzing ? "Sto mettendo ordine..." : "Metti ordine"}
                  </span>

                  {isAnalyzing ? (
                    <LoaderCircle
                      className="mind-dump-page__spinner"
                      size={18}
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      size={18}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
            </form>

            <p className="mind-dump-page__reassurance">
              Potrai controllare e correggere i risultati prima di salvarli.
            </p>
          </>
        ) : editingItem ? (
          <MindDumpEdit
            item={editingItem}
            onSave={handleSaveItem}
            onCancel={() => setEditingItem(null)}
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
