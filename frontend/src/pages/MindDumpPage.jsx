import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Feather, LoaderCircle } from "lucide-react";

import MindDumpResult from "../components/MindDumpResult/MindDumpResult";
import MindDumpEdit from "../components/MindDumpEdit/MindDumpEdit";
import MindDumpAnalysisWaiting from "../components/MindDumpAnalysisWaiting";
import VoiceDictationButton from "../components/VoiceDictationButton";

import { useAuth } from "../context/useAuth";
import { useVoiceDictation } from "../hooks/useVoiceDictation";
import { apiRequest } from "../services/api";

import {
  clearSavedMindDumpDraft,
  readMindDumpDraft,
  writeMindDumpDraft,
} from "../services/mindDumpDraft";

import {
  MAX_ITEMS,
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  TYPE_LABELS,
  isValidTitle,
} from "../config/mindDump";

import "./MindDumpPage.css";

// Ogni utente ha una bozza personale.
function getDraftKey(userId) {
  return userId ? `adhdDailyDraft:${userId}` : null;
}

function MindDumpPage() {
  const { token, user } = useAuth();
  const draftKey = getDraftKey(user?.id);

  const [draft, setDraft] = useState(() => readMindDumpDraft(draftKey));

  const [result, setResult] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mindDump = draft.text;
  const hasContent = mindDump.trim().length > 0;

  // Aggiorna il testo scritto e conserva la bozza.
  function handleMindDumpChange(event) {
    const text = event.target.value;

    setDraft(writeMindDumpDraft(draftKey, text));

    setError("");
    setSuccessMessage("");
  }

  // Aggiunge le parole dettate al testo già presente.
  function handleVoiceTranscript(transcript) {
    if (!transcript.trim()) return;

    setDraft((currentDraft) => {
      const currentText = currentDraft.text;

      const separator = currentText && !/\s$/.test(currentText) ? " " : "";

      const updatedText = (currentText + separator + transcript).slice(
        0,
        MAX_TEXT_LENGTH,
      );

      return writeMindDumpDraft(draftKey, updatedText);
    });

    setError("");
    setSuccessMessage("");
  }

  // Gestione del riconoscimento vocale.
  const {
    isSupported,
    isListening,
    voiceError,
    startListening,
    stopListening,
  } = useVoiceDictation(handleVoiceTranscript);

  // Analizza il testo senza salvarlo in MongoDB.
  async function handleOrganize(event) {
    event.preventDefault();

    if (!hasContent || isAnalyzing || isSaving || isListening) {
      return;
    }

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

      if (!Array.isArray(analysis?.items) || analysis.items.length === 0) {
        throw new Error("Non sono riuscito a interpretare il testo. Riprova.");
      }

      if (analysis.items.length > MAX_ITEMS) {
        throw new Error(
          "Il testo contiene troppi elementi. Prova a dividerlo in due parti.",
        );
      }

      const isValidResult = analysis.items.every(
        (item) =>
          item &&
          Object.hasOwn(TYPE_LABELS, item.type) &&
          isValidTitle(item.title),
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
        draftSnapshot: {
          text: draft.text,
          version: draft.version,
        },
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

  // Apre la modifica di un elemento.
  function handleEditItem(item) {
    setError("");
    setEditingItem(item);
  }

  // Aggiorna un elemento prima della conferma.
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

  // Salva soltanto dopo la conferma dell'utente.
  async function handleConfirm() {
    if (!result || isSaving) return;

    const hasInvalidTitles = result.items.some(
      (item) => !isValidTitle(item.title),
    );

    if (hasInvalidTitles) {
      setError(
        `Controlla i titoli: devono contenere massimo ${MAX_TITLE_LENGTH} caratteri.`,
      );
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

      setDraft(clearSavedMindDumpDraft(draftKey, result.draftSnapshot));

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

  // Torna alla scrittura senza cancellare la bozza.
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

        {voiceError && (
          <p className="mind-dump-page__alert" role="alert">
            {voiceError}
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

                  {isSupported ? (
                    <VoiceDictationButton
                      onClick={isListening ? stopListening : startListening}
                      disabled={isAnalyzing || isSaving}
                      isListening={isListening}
                    />
                  ) : (
                    <Feather size={19} strokeWidth={1.5} aria-hidden="true" />
                  )}
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
                  <span id="mind-dump-hint">
                    {isListening
                      ? "Microfono attivo. Parla liberamente."
                      : "Nessun ordine necessario."}
                  </span>

                  {mindDump.length >= 9000 && (
                    <span className="mind-dump-page__counter">
                      {mindDump.length}/{MAX_TEXT_LENGTH}
                    </span>
                  )}
                </div>

                {isAnalyzing && <MindDumpAnalysisWaiting />}
              </div>

              <div className="mind-dump-page__actions">
                <button
                  className="mind-dump-page__organize"
                  type="submit"
                  disabled={!hasContent || isAnalyzing || isListening}
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
    </main>
  );
}

export default MindDumpPage;
