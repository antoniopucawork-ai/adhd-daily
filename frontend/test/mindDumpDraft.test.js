import assert from "node:assert/strict";
import test from "node:test";
import {
  clearSavedMindDumpDraft,
  readMindDumpDraft,
  writeMindDumpDraft,
} from "../src/services/mindDumpDraft.js";

const key = "adhdDailyDraft:utente-A";

function createStorage() {
  const values = new Map();
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: (name) => values.delete(name),
  };
}

test("un salvataggio in ritardo non cancella la nuova bozza scritta dopo il ritorno alla pagina", async () => {
  const storage = createStorage();
  const savedDraft = writeMindDumpDraft(key, "Pensiero A", storage);
  let confirmSave;
  const pendingSave = new Promise((resolve) => { confirmSave = resolve; });
  const completion = pendingSave.then(() => clearSavedMindDumpDraft(key, savedDraft, storage));

  // Una nuova istanza della pagina recupera la bozza e poi scrive B.
  assert.equal(readMindDumpDraft(key, storage).text, "Pensiero A");
  const newDraft = writeMindDumpDraft(key, "Pensiero B", storage);
  confirmSave();

  assert.deepEqual(await completion, newDraft);
  assert.deepEqual(readMindDumpDraft(key, storage), newDraft);
});

test("una nuova versione resta protetta anche se il testo torna identico a quello salvato", () => {
  const storage = createStorage();
  const savedDraft = writeMindDumpDraft(key, "Pensiero A", storage);
  writeMindDumpDraft(key, "Pensiero B", storage);
  const newDraft = writeMindDumpDraft(key, "Pensiero A", storage);

  assert.notEqual(newDraft.version, savedDraft.version);
  assert.deepEqual(clearSavedMindDumpDraft(key, savedDraft, storage), newDraft);
  assert.deepEqual(readMindDumpDraft(key, storage), newDraft);
});

test("il salvataggio normale cancella la propria versione anche dopo una riapertura", () => {
  const storage = createStorage();
  const savedDraft = writeMindDumpDraft(key, "Pensiero A", storage);
  assert.deepEqual(readMindDumpDraft(key, storage), savedDraft);

  assert.deepEqual(clearSavedMindDumpDraft(key, savedDraft, storage), {
    text: "", version: null, error: "",
  });
  assert.equal(storage.getItem(key), null);
});

test("le bozze precedenti sono lette senza alterare il testo o il localStorage", () => {
  const storage = createStorage();
  for (const text of ["  Bozza già presente\n", '{"text":"un pensiero in JSON"}']) {
    storage.setItem(key, text);
    assert.deepEqual(readMindDumpDraft(key, storage), { text, version: null, error: "" });
    assert.equal(storage.getItem(key), text);
  }
});

test("anche una bozza precedente può essere salvata e cancellata normalmente", () => {
  const storage = createStorage();
  storage.setItem(key, "Bozza precedente");
  const savedDraft = readMindDumpDraft(key, storage);

  clearSavedMindDumpDraft(key, savedDraft, storage);
  assert.equal(storage.getItem(key), null);
});

test("il salvataggio di una bozza precedente protegge una nuova versione con lo stesso testo", () => {
  const storage = createStorage();
  storage.setItem(key, "Bozza precedente");
  const savedDraft = readMindDumpDraft(key, storage);
  const newDraft = writeMindDumpDraft(key, savedDraft.text, storage);

  clearSavedMindDumpDraft(key, savedDraft, storage);
  assert.deepEqual(readMindDumpDraft(key, storage), newDraft);
});

test("la pulizia riguarda soltanto l'account del salvataggio", () => {
  const storage = createStorage();
  const savedDraft = writeMindDumpDraft(key, "Pensiero A", storage);
  const otherKey = "adhdDailyDraft:utente-B";
  const otherDraft = writeMindDumpDraft(otherKey, "Pensiero privato B", storage);

  clearSavedMindDumpDraft(key, savedDraft, storage);
  assert.deepEqual(readMindDumpDraft(otherKey, storage), otherDraft);
});

test("un errore di cancellazione conserva il testo e segnala che il pensiero è già salvato", () => {
  const storage = createStorage();
  const savedDraft = writeMindDumpDraft(key, "Pensiero A", storage);
  const failingStorage = {
    ...storage,
    removeItem() { throw new Error("Storage non disponibile"); },
  };

  const result = clearSavedMindDumpDraft(key, savedDraft, failingStorage);
  assert.equal(result.text, savedDraft.text);
  assert.match(result.error, /Il pensiero è salvato/);
  assert.deepEqual(readMindDumpDraft(key, storage), savedDraft);
});


test("l'accesso al localStorage bloccato dal browser viene gestito senza perdere il testo", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() { throw new Error("Storage bloccato dal browser"); },
  });

  try {
    assert.match(readMindDumpDraft(key).error, /recuperare la bozza/);
    const draft = writeMindDumpDraft(key, "Pensiero A");
    assert.equal(draft.text, "Pensiero A");
    assert.match(draft.error, /salvare la bozza/);
    const result = clearSavedMindDumpDraft(key, draft);
    assert.equal(result.text, "Pensiero A");
    assert.match(result.error, /Il pensiero è salvato/);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
});
