import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";

import BottomNav from "../components/BottomNav/BottomNav";
import MindDumpEdit from "../components/MindDumpEdit/MindDumpEdit";

import "./ArchivePage.css";
import DeleteAllMindDumps from "../components/DeleteAllMindDumps/DeleteAllMindDumps";

const TYPE_LABELS = {
  ACTION: "Da fare",
  EVENT: "In programma",
  MEMORY: "Da ricordare",
  INTENTION: "Forse",
  THOUGHT: "Pensieri liberi",
};

function formatDate(value) {
  if (!value) return "Senza data";

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "Data non valida";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Data non valida";
  }

  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArchivePage() {
  const { token } = useAuth();
  const location = useLocation();

  const [savedData, setSavedData] = useState({
    items: [],
    error: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Stato della cancellazione.
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Stato della modifica.
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [editError, setEditError] = useState("");

  // Recuperiamo i pensieri dell'utente autenticato.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadMindDumps() {
      setIsLoading(true);

      try {
        const mindDumps = await apiRequest("/api/mind-dumps", {
          token,
        });

        if (!Array.isArray(mindDumps)) {
          throw new Error("Formato dei dati non valido.");
        }

        const items = mindDumps.flatMap((mindDump) =>
          (mindDump.items || []).map((item) => ({
            ...item,
            id: item._id,
            source: {
              mindDumpId: mindDump._id,
              originalText: mindDump.originalText,
            },
          })),
        );

        if (!cancelled) {
          setSavedData({
            items,
            error: "",
          });
        }
      } catch (error) {
        console.error("Errore caricamento archivio:", error);

        if (!cancelled) {
          setSavedData({
            items: [],
            error:
              "Non riesco a caricare gli elementi salvati. Riprova tra poco.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMindDumps();

    return () => {
      cancelled = true;
    };
  }, [token, retryCount]);

  // Raggiungiamo l'elemento selezionato dalla Home.
  useEffect(() => {
    if (isLoading || !location.hash || savedData.error) return;

    let itemId;

    try {
      itemId = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }

    const element = document.getElementById(itemId);

    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [location.hash, savedData, isLoading]);

  // Apriamo il modulo per modificare un pensiero.
  function handleStartEdit(itemId) {
    if (savingId || deletingId) return;

    setEditingId(itemId);
    setEditError("");

    // Teniamo aperta una sola operazione alla volta.
    setConfirmDeleteId(null);
    setDeleteError("");
  }

  function handleCancelEdit() {
    if (savingId) return;

    setEditingId(null);
    setEditError("");
  }

  // Salviamo in MongoDB i campi modificati.
  async function handleSaveEdit(updatedItem) {
    if (savingId || deletingId) return;

    const currentItem = savedData.items.find((item) => item.id === editingId);

    const dumpId = currentItem?.source?.mindDumpId;
    const itemId = currentItem?.id;

    if (!dumpId || !itemId) {
      setEditError("Non riesco a identificare questo elemento.");
      return;
    }

    setSavingId(itemId);
    setEditError("");

    try {
      const response = await apiRequest(
        `/api/mind-dumps/${encodeURIComponent(dumpId)}/items/${encodeURIComponent(itemId)}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            type: updatedItem.type,
            title: updatedItem.title,
            date: updatedItem.date || null,
            time: updatedItem.time || null,
            uncertain: updatedItem.uncertain ?? false,
          }),
        },
      );

      if (!response.item || response.item._id !== itemId) {
        throw new Error(
          "Il server non ha confermato correttamente la modifica.",
        );
      }

      // Aggiorniamo l'interfaccia solo dopo la risposta del backend.
      setSavedData((previous) => ({
        ...previous,
        items: previous.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...response.item,
                id: item.id,
                source: item.source,
              }
            : item,
        ),
      }));

      setEditingId(null);
    } catch (error) {
      setEditError(error.message || "Non riesco a salvare le modifiche.");
    } finally {
      setSavingId(null);
    }
  }

  function requestDelete(itemId) {
    if (deletingId || savingId) return;

    setConfirmDeleteId(itemId);
    setDeleteError("");
    setEditingId(null);
    setEditError("");
  }

  function cancelDelete() {
    if (deletingId) return;

    setConfirmDeleteId(null);
    setDeleteError("");
  }

  // Eliminiamo il pensiero dal server.
  async function handleDelete(item) {
    if (deletingId || savingId) return;

    const dumpId = item.source?.mindDumpId;
    const itemId = item.id;

    if (!dumpId || !itemId) {
      setDeleteError("Non riesco a identificare questo elemento.");
      return;
    }

    setDeletingId(itemId);
    setDeleteError("");

    try {
      await apiRequest(
        `/api/mind-dumps/${encodeURIComponent(dumpId)}/items/${encodeURIComponent(itemId)}`,
        {
          method: "DELETE",
          token,
        },
      );

      setSavedData((previous) => ({
        ...previous,
        items: previous.items.filter((savedItem) => savedItem.id !== itemId),
      }));

      setConfirmDeleteId(null);
    } catch (error) {
      setDeleteError(error.message || "Impossibile eliminare il pensiero.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="archive-page">
      <div className="archive-page__container">
        {!isLoading && !savedData.error && savedData.items.length > 0 && (
          <DeleteAllMindDumps
            token={token}
            count={savedData.items.length}
            onDeleted={() => setRetryCount((count) => count + 1)}
          />
        )}
        <header className="archive-page__header">
          <Link className="archive-page__back" to="/">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Home</span>
          </Link>

          <h1>Tutti gli elementi</h1>

          <p>Ritrova ciò che hai salvato, anche senza una data.</p>
        </header>

        {isLoading ? (
          <div className="archive-page__message">
            <p>Caricamento dei tuoi elementi...</p>
          </div>
        ) : savedData.error ? (
          <div className="archive-page__message">
            <p role="alert">{savedData.error}</p>

            <button
              className="archive-page__retry"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Riprova
            </button>
          </div>
        ) : savedData.items.length === 0 ? (
          <div className="archive-page__message">
            <p>Non hai ancora salvato elementi.</p>

            <Link className="archive-page__empty-link" to="/svuota">
              Svuota la mente
            </Link>
          </div>
        ) : (
          <ul className="archive-page__list">
            {savedData.items.map((item) => {
              const originalText = item.source?.originalText;

              const hasOriginal =
                typeof originalText === "string" && originalText.length > 0;

              const typeLabel =
                typeof item.type === "string"
                  ? TYPE_LABELS[item.type] || "Elemento"
                  : "Elemento";

              const isEditing = editingId === item.id;
              const isSaving = savingId === item.id;
              const isConfirming = confirmDeleteId === item.id;
              const isDeleting = deletingId === item.id;
              const isBusy = Boolean(savingId || deletingId);

              return (
                <li
                  className="archive-page__card"
                  key={item.id}
                  id={`item-${item.id}`}
                >
                  <div className="archive-page__card-header">
                    <span className="archive-page__type">{typeLabel}</span>

                    {item.status === "DONE" && (
                      <span className="archive-page__done">Completato</span>
                    )}

                    {item.uncertain && (
                      <span className="archive-page__type">Da confermare</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="archive-page__editor">
                      <MindDumpEdit
                        item={item}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />

                      {isSaving && (
                        <p className="archive-page__edit-status" role="status">
                          Salvataggio in corso...
                        </p>
                      )}

                      {editError && (
                        <p className="archive-page__edit-error" role="alert">
                          {editError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <h2>{item.title}</h2>

                      <p className="archive-page__date">
                        {formatDate(item.date)}

                        {typeof item.time === "string" && item.time
                          ? ` · ${item.time}`
                          : ""}
                      </p>

                      {hasOriginal ? (
                        <details className="archive-page__source">
                          <summary>Testo originale</summary>
                          <p>{originalText}</p>
                        </details>
                      ) : (
                        <p className="archive-page__missing-source">
                          Testo originale non disponibile.
                        </p>
                      )}

                      <div className="archive-page__actions">
                        <button
                          className="archive-page__edit-button"
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStartEdit(item.id)}
                          aria-label={`Modifica ${item.title}`}
                        >
                          <Pencil size={16} aria-hidden="true" />
                          Modifica
                        </button>

                        <button
                          className="archive-page__delete"
                          type="button"
                          disabled={isBusy}
                          onClick={() => requestDelete(item.id)}
                          aria-label={`Elimina ${item.title}`}
                          aria-expanded={isConfirming}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          Elimina
                        </button>
                      </div>

                      {isConfirming && (
                        <div
                          className="archive-page__confirm"
                          role="group"
                          aria-label={`Conferma eliminazione di ${item.title}`}
                        >
                          <p className="archive-page__confirm-title">
                            Vuoi eliminare questo elemento?
                          </p>

                          <p className="archive-page__confirm-description">
                            Non potrai recuperarlo. Se il Mind Dump contiene
                            altri elementi, il testo originale rimarrà salvato
                            insieme a essi.
                          </p>

                          {deleteError && (
                            <p
                              className="archive-page__delete-error"
                              role="alert"
                            >
                              {deleteError}
                            </p>
                          )}

                          <div className="archive-page__confirm-actions">
                            <button
                              className="archive-page__cancel"
                              type="button"
                              disabled={isDeleting}
                              onClick={cancelDelete}
                            >
                              Annulla
                            </button>

                            <button
                              className="archive-page__confirm-delete"
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(item)}
                            >
                              {isDeleting ? "Eliminazione..." : "Sì, elimina"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default ArchivePage;
