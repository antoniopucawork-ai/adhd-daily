import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useMindDumpInvalidation } from "../context/mindDumpInvalidationStore";
import { apiRequest } from "../services/api";

export function useMindDumps() {
  const { token } = useAuth();

  const [result, setResult] = useState(null);

  const { revision, reload } = useMindDumpInvalidation();

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadMindDumps() {
      try {
        const mindDumps = await apiRequest("/api/mind-dumps", {
          token,
        });

        if (!Array.isArray(mindDumps)) {
          throw new Error("Il formato dei pensieri non è valido.");
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
          setResult({
            token,
            revision,
            dumps: mindDumps,
            items,
            error: "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({
            token,
            revision,
            dumps: [],
            items: [],
            error: error.message || "Non riesco a recuperare i pensieri.",
          });
        }
      }
    }

    loadMindDumps();

    return () => {
      cancelled = true;
    };
  }, [token, revision]);

  const currentResult = result?.token === token && result?.revision === revision ? result : null;

  return {
    dumps: currentResult?.dumps ?? [],
    reload,
    items: currentResult?.items ?? [],
    isLoading: Boolean(token && !currentResult),
    error: currentResult?.error ?? "",
  };
}
