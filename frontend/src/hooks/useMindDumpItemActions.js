import { useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import { updateMindDumpItem } from "../services/mindDumpItems";
import { canCompleteAction } from "../utils/organizeItems";

export function useMindDumpItemActions({ items, reload }) {
  const { token } = useAuth();

  const busyRef = useRef(false);
  const [completingId, setCompletingId] = useState(null);
  const [completionError, setCompletionError] = useState("");

  async function completeItem(itemId) {
    if (busyRef.current) return false;

    const item = items.find((entry) => entry.id === itemId);

    if (!canCompleteAction(item) || !item.source?.mindDumpId) {
      setCompletionError("Questa attività non può essere completata.");
      return false;
    }

    busyRef.current = true;
    setCompletingId(itemId);
    setCompletionError("");

    try {
      const updated = await updateMindDumpItem({
        item,
        changes: { status: "DONE" },
        token,
      });

      if (updated.status !== "DONE") {
        throw new Error("Completamento non confermato.");
      }

      reload();
      return true;
    } catch (error) {
      if (error.name !== "AbortError" && error.status !== 401) {
        setCompletionError("Non riesco a completare l'attività. Riprova.");
      }
      return false;
    } finally {
      busyRef.current = false;
      setCompletingId(null);
    }
  }

  return {
    completeItem,
    completingId,
    completionError,
    clearCompletionError: () => setCompletionError(""),
  };
}
