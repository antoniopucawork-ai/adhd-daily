import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

import { apiRequest } from "../../services/api";

import "./DeleteAllMindDumps.css";

const CONFIRMATION_TEXT = "ELIMINA TUTTO";

function DeleteAllMindDumps({ token, count, onDeleted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmation.trim() === CONFIRMATION_TEXT && !isDeleting;

  function handleCancel() {
    if (isDeleting) return;

    setIsOpen(false);
    setConfirmation("");
    setError("");
  }

  async function handleDeleteAll(event) {
    event.preventDefault();

    if (!canDelete || !token) return;

    setIsDeleting(true);
    setError("");

    try {
      await apiRequest("/api/mind-dumps", {
        method: "DELETE",
        token,
        body: JSON.stringify({
          confirmation: CONFIRMATION_TEXT,
        }),
      });

      setIsOpen(false);
      setConfirmation("");

      // L'Archivio recupererà nuovamente i dati dal server.
      onDeleted();
    } catch (err) {
      setError(err.message || "Non è stato possibile eliminare i pensieri.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="delete-all" aria-label="Gestione dei pensieri salvati">
      {!isOpen ? (
        <button
          type="button"
          className="delete-all__trigger"
          onClick={() => setIsOpen(true)}
        >
          <Trash2 size={17} aria-hidden="true" />
          Elimina tutti i pensieri
        </button>
      ) : (
        <form className="delete-all__panel" onSubmit={handleDeleteAll}>
          <div className="delete-all__heading">
            <AlertTriangle size={20} aria-hidden="true" />

            <h2>Vuoi eliminare tutti i tuoi pensieri?</h2>
          </div>

          <p className="delete-all__description">
            Verranno eliminati tutti i tuoi Mind Dump, compresi i testi
            originali e i {count} elementi attualmente presenti nell'Archivio.
            Questa operazione è definitiva.
          </p>

          <label
            className="delete-all__label"
            htmlFor="delete-all-confirmation"
          >
            Per confermare, scrivi <strong>ELIMINA TUTTO</strong>
          </label>

          <input
            id="delete-all-confirmation"
            className="delete-all__input"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={isDeleting}
            placeholder="ELIMINA TUTTO"
          />

          {error && (
            <p className="delete-all__error" role="alert">
              {error}
            </p>
          )}

          <div className="delete-all__actions">
            <button
              type="button"
              className="delete-all__cancel"
              disabled={isDeleting}
              onClick={handleCancel}
            >
              Annulla
            </button>

            <button
              type="submit"
              className="delete-all__confirm"
              disabled={!canDelete}
            >
              {isDeleting ? "Eliminazione..." : "Elimina definitivamente"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default DeleteAllMindDumps;
