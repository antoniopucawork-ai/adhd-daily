import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { getGoogleCalendarUrl } from "../../utils/googleCalendar";
import { TYPE_LABELS } from "../../config/mindDump";
import { canCompleteAction } from "../../utils/organizeItems";

import "./ItemQuickPanel.css";

function ItemQuickPanel({
  item,
  onClose,
  onComplete,
  onEdit,
  onDelete,
  deleteConfirmation,
  children,
  closeDisabled = false,
  isCompleting = false,
  completionError = "",
}) {
  const dialogRef = useRef(null);
  const editButtonRef = useRef(null);
  const deleteButtonRef = useRef(null);
  const previousView = useRef("details");
  const view = deleteConfirmation ? "delete" : children ? "edit" : "details";

  useEffect(() => {
    if (view === "edit") {
      dialogRef.current?.querySelector('input[name="title"]')?.focus();
    } else if (view === "delete") {
      dialogRef.current?.querySelector("[data-cancel-delete]")?.focus();
    } else if (previousView.current === "edit") {
      editButtonRef.current?.focus();
    } else if (previousView.current === "delete") {
      deleteButtonRef.current?.focus();
    }
    previousView.current = view;
  }, [view]);

  // Apertura e pulizia della finestra modale.
  useEffect(() => {
    if (!item) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [item]);

  if (!item) return null;

  const canComplete = canCompleteAction(item);
  const googleCalendarUrl = getGoogleCalendarUrl(item);

  return (
    <dialog
      ref={dialogRef}
      className="item-quick-panel"
      aria-labelledby="item-quick-panel-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!closeDisabled) onClose();
      }}
    >
      <div className="item-quick-panel__header">
        <span className="item-quick-panel__eyebrow">
          {TYPE_LABELS[item.type] || "Il tuo elemento"}
        </span>

        <button
          className="item-quick-panel__close"
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Chiudi il pannello"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <h2 id="item-quick-panel-title" className="item-quick-panel__title">
        {item.title}
      </h2>

      {deleteConfirmation || children || (
        <>
          <p className="item-quick-panel__description">Un passo alla volta.</p>

          {(item.date || item.time) && (
            <div className="item-quick-panel__details">
              {item.date && (
                <p>
                  <CalendarDays size={18} aria-hidden="true" />
                  <span>{item.date}</span>
                </p>
              )}

              {item.time && (
                <p>
                  <Clock3 size={18} aria-hidden="true" />
                  <span>{item.time}</span>
                </p>
              )}
            </div>
          )}

          {item.uncertain && (
            <p className="item-quick-panel__warning">
              <AlertTriangle size={18} aria-hidden="true" />
              Questa informazione ha bisogno di un chiarimento.
            </p>
          )}

          {item.status === "DONE" && (
            <p className="item-quick-panel__completed">
              <Check size={18} aria-hidden="true" />
              Attività completata
            </p>
          )}

          {completionError && (
            <p className="item-quick-panel__warning" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              {completionError}
            </p>
          )}

          <div className="item-quick-panel__actions">
            {googleCalendarUrl && (
              <a
                className="item-quick-panel__calendar"
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CalendarDays size={18} aria-hidden="true" />
                Google Calendar
              </a>
            )}

            {onEdit && (
              <button
                ref={editButtonRef}
                className="item-quick-panel__edit"
                type="button"
                onClick={() => onEdit(item)}
                disabled={isCompleting}
              >
                <Pencil size={18} aria-hidden="true" />
                Modifica
              </button>
            )}

            {onDelete && (
              <button
                ref={deleteButtonRef}
                className="item-quick-panel__delete"
                type="button"
                onClick={onDelete}
                disabled={isCompleting}
              >
                <Trash2 size={18} aria-hidden="true" />
                Elimina
              </button>
            )}

            {canComplete && onComplete && (
              <button
                className="item-quick-panel__complete"
                type="button"
                onClick={() => onComplete(item.id)}
                disabled={isCompleting}
              >
                <Check size={18} aria-hidden="true" />
                {isCompleting ? "Completamento..." : "Completa"}
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}

export default ItemQuickPanel;
