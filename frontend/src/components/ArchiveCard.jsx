import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import MindDumpEdit from "./MindDumpEdit/MindDumpEdit";
import { apiRequest } from "../services/api";

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

function OrganizedItem({ item, originalText }) {
  return (
    <>
      <div className="archive-page__card-header">
        <span className="archive-page__type">{TYPE_LABELS[item.type] || "Elemento"}</span>
        {item.status === "DONE" && <span className="archive-page__done">Completato</span>}
        {item.uncertain && <span className="archive-page__type">Da confermare</span>}
      </div>
      <h2>{item.title}</h2>
      <p className="archive-page__date">
        {formatDate(item.date)}{item.time && ` · ${item.time}`}
      </p>
      {originalText ? (
        <details className="archive-page__source">
          <summary>Testo originale</summary>
          <p>{originalText}</p>
        </details>
      ) : (
        <p className="archive-page__missing-source">Testo originale non disponibile.</p>
      )}
    </>
  );
}

export default function ArchiveCard({
  id, dump, item, token, disabled, onActiveChange, onChanged,
}) {
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dumpUrl = `/api/mind-dumps/${encodeURIComponent(dump._id)}`;
  const itemUrl = item && `${dumpUrl}/items/${encodeURIComponent(item._id)}`;

  function select(next) {
    if (busy || disabled) return;
    setError("");
    setAction(next);
    onActiveChange(Boolean(next));
  }

  async function submit(updated) {
    if (busy || disabled) return;
    setBusy(true);
    setError("");
    try {
      if (action === "edit") {
        const changes = {};
        for (const key of ["type", "title", "date", "time", "uncertain"]) {
          if (updated[key] !== item[key]) changes[key] = updated[key];
        }
        if (Object.keys(changes).length) {
          const result = await apiRequest(itemUrl, {
            method: "PATCH", token, body: JSON.stringify(changes),
          });
          if (result?.item?._id !== item._id) {
            throw new Error("Il server non ha confermato la modifica.");
          }
        }
      } else if (action === "deleteDump" || action === "deleteItem") {
        const url = action === "deleteDump" ? dumpUrl : itemUrl;
        await apiRequest(url, { method: "DELETE", token });
      } else {
        return;
      }
      onChanged();
    } catch (err) {
      setError(err.message || "Operazione non riuscita. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  const deletingDump = action === "deleteDump";
  return (
    <li className="archive-page__card" id={id}>
      {item ? (
        <OrganizedItem item={item} originalText={dump.originalText} />
      ) : (
        <>
          <h2>Testo originale</h2>
          <div className="archive-page__source"><p>{dump.originalText}</p></div>
        </>
      )}
      {action === "edit" ? (
        <div className="archive-page__editor" aria-busy={busy}>
          <MindDumpEdit item={item} onSave={submit} onCancel={() => select(null)} />
          {busy && <p role="status">Salvataggio in corso...</p>}
        </div>
      ) : action ? (
        <div className="archive-page__confirm" role="group" aria-label="Conferma eliminazione">
          <p className="archive-page__confirm-title">
            {deletingDump ? "Eliminare l’intero Mind Dump?" : "Eliminare questo elemento?"}
          </p>
          <p className="archive-page__confirm-description">
            {deletingDump
              ? `Perderai definitivamente il testo originale e tutti gli elementi di questo Mind Dump (${dump.items?.length ?? 0}).`
              : "L’elemento verrà eliminato definitivamente. Il testo originale resterà nell’Archivio anche se questo è l’ultimo elemento."}
          </p>
          <div className="archive-page__confirm-actions">
            <button
              type="button"
              className="archive-page__cancel"
              disabled={busy}
              onClick={() => select(null)}
            >
              Annulla
            </button>
            <button
              type="button"
              className="archive-page__confirm-delete"
              disabled={busy}
              onClick={() => submit()}
            >
              {busy ? "Eliminazione..." : "Sì, elimina"}
            </button>
          </div>
        </div>
      ) : (
        <div className="archive-page__actions">
          {item && (
            <>
              <button
                type="button"
                className="archive-page__edit-button"
                disabled={disabled}
                onClick={() => select("edit")}
              >
                <Pencil size={16} aria-hidden="true" /> Modifica
              </button>
              <button
                type="button"
                className="archive-page__delete"
                disabled={disabled}
                onClick={() => select("deleteItem")}
              >
                <Trash2 size={16} aria-hidden="true" /> Elimina elemento
              </button>
            </>
          )}
          <button
            type="button"
            className="archive-page__delete"
            disabled={disabled}
            onClick={() => select("deleteDump")}
          >
            <Trash2 size={16} aria-hidden="true" /> Elimina Mind Dump
          </button>
        </div>
      )}
      {error && <p className="archive-page__edit-error" role="alert">{error}</p>}
    </li>
  );
}
