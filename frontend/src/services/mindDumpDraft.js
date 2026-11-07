const DRAFT_FORMAT = "adhd-daily-draft-v1";

function emptyDraft() {
  return { text: "", version: null, error: "" };
}

function decodeDraft(value) {
  if (value === null) return emptyDraft();

  try {
    const draft = JSON.parse(value);
    if (
      draft?.format === DRAFT_FORMAT &&
      typeof draft.text === "string" &&
      typeof draft.version === "string"
    ) {
      return { text: draft.text, version: draft.version, error: "" };
    }
  } catch {
    // Le bozze precedenti contengono soltanto il testo originale.
  }

  return { text: value, version: null, error: "" };
}

export function readMindDumpDraft(key, storage) {
  if (!key) return emptyDraft();

  try {
    storage ??= localStorage;
    return decodeDraft(storage.getItem(key));
  } catch {
    return { ...emptyDraft(), error: "Non riesco a recuperare la bozza dal browser." };
  }
}

export function writeMindDumpDraft(key, text, storage) {
  const draft = { text, version: crypto.randomUUID(), error: "" };

  if (!key) {
    return { ...draft, error: "Non riesco a identificare la bozza dell'utente." };
  }

  try {
    storage ??= localStorage;
    if (text.length > 0) {
      storage.setItem(key, JSON.stringify({ format: DRAFT_FORMAT, text, version: draft.version }));
    } else {
      storage.removeItem(key);
    }
  } catch {
    draft.error = "Non riesco a salvare la bozza nel browser.";
  }

  return draft;
}

export function clearSavedMindDumpDraft(key, savedDraft, storage) {
  if (!key) return emptyDraft();

  try {
    storage ??= localStorage;
    const current = decodeDraft(storage.getItem(key));
    if (current.version !== savedDraft.version || current.text !== savedDraft.text) {
      return current;
    }

    storage.removeItem(key);
    return emptyDraft();
  } catch {
    return {
      ...savedDraft,
      error: "Il pensiero è salvato, ma non sono riuscito a cancellare la bozza dal browser.",
    };
  }
}
