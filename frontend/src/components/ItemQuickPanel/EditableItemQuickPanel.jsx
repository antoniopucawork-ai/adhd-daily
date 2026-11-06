import { useRef, useState } from "react";

import MindDumpEdit from "../MindDumpEdit/MindDumpEdit";
import { useAuth } from "../../context/useAuth";
import { deleteMindDumpItem, updateMindDumpItem } from "../../services/mindDumpItems";
import ItemQuickPanel from "./ItemQuickPanel";

export default function EditableItemQuickPanel({
  item,
  onClose,
  reload,
  onComplete,
  isCompleting,
  completionError,
}) {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const mutationRef = useRef(false);

  function closeItem() {
    if (mutationRef.current) return;
    onClose();
  }

  function cancelEdit() {
    setIsEditing(false);
    setSaveError("");
  }

  async function saveItem(updatedItem) {
    if (mutationRef.current) return;

    const changes = {};
    for (const field of ["title", "type", "date", "time", "uncertain"]) {
      const currentValue =
        item[field] ?? (field === "uncertain" ? false : null);
      if (updatedItem[field] !== currentValue) changes[field] = updatedItem[field];
    }

    if (Object.keys(changes).length === 0) {
      cancelEdit();
      return;
    }

    mutationRef.current = true;
    setIsSaving(true);
    setSaveError("");

    try {
      await updateMindDumpItem({ item, changes, token });
      onClose();
      reload();
    } catch (failure) {
      if (failure.name !== "AbortError" && failure.status !== 401) {
        setSaveError(failure.message || "Impossibile salvare le modifiche. Riprova.");
      }
    } finally {
      mutationRef.current = false;
      setIsSaving(false);
    }
  }

  function cancelDelete() {
    setIsConfirmingDelete(false);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (mutationRef.current || isCompleting) return;

    mutationRef.current = true;
    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteMindDumpItem({
        dumpId: item.source?.mindDumpId,
        itemId: item.id,
        token,
      });
      onClose();
      reload();
    } catch (failure) {
      if (failure.name !== "AbortError" && failure.status !== 401) {
        setDeleteError(failure.message || "Impossibile eliminare l’elemento. Riprova.");
      }
    } finally {
      mutationRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <ItemQuickPanel
      item={item}
      onClose={closeItem}
      onEdit={() => setIsEditing(true)}
      onDelete={() => setIsConfirmingDelete(true)}
      closeDisabled={isSaving || isDeleting}
      deleteConfirmation={isConfirmingDelete && (
        <div role="group" aria-label="Conferma eliminazione">
          <p className="item-quick-panel__description">
            Eliminare definitivamente questo elemento? Il testo originale
            resterà nell’Archivio anche se è l’ultimo elemento.
          </p>
          {deleteError && (
            <p className="item-quick-panel__warning" role="alert">{deleteError}</p>
          )}
          <div className="item-quick-panel__actions">
            <button
              className="item-quick-panel__edit"
              type="button"
              data-cancel-delete
              onClick={cancelDelete}
              disabled={isDeleting}
            >
              Annulla
            </button>
            <button
              className="item-quick-panel__delete"
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting || isCompleting}
            >
              {isDeleting ? "Eliminazione..." : "Sì, elimina"}
            </button>
          </div>
        </div>
      )}
      onComplete={onComplete}
      isCompleting={isCompleting}
      completionError={completionError}
    >
      {isEditing && (
        <>
          <MindDumpEdit
            item={item}
            onSave={saveItem}
            onCancel={cancelEdit}
            cancelLabel="Torna al dettaglio"
            isSaving={isSaving}
          />
          {saveError && (
            <p className="item-quick-panel__warning" role="alert">
              {saveError}
            </p>
          )}
        </>
      )}
    </ItemQuickPanel>
  );
}
