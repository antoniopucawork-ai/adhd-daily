import assert from "node:assert/strict";
import test from "node:test";
import { resolveTemporalExpression } from "../services/dateValidation.js";

const referenceDate = "2026-11-07";

test("risolve le date esplicite con giorno della settimana coerente", () => {
  for (const [weekday, day] of [
    ["Lunedì", "09"], ["Martedì", "10"], ["Mercoledì", "11"],
    ["Giovedì", "12"], ["Venerdì", "13"], ["Sabato", "14"], ["Domenica", "15"],
  ]) {
    assert.deepEqual(resolveTemporalExpression(`${weekday} ${Number(day)} novembre 2026`, referenceDate), {
      date: `2026-11-${day}`, status: "resolved",
    });
  }
});

test("rifiuta giorni contraddittori, date inesistenti e date composte senza anno", () => {
  for (const expression of [
    "Martedì 9 novembre 2026", "Lunedì 31 novembre 2026", "Lunedì 29 febbraio 2027", "Lunedì 9 novembre",
  ]) {
    assert.deepEqual(resolveTemporalExpression(expression, referenceDate), {
      date: null, status: "unsupported",
    });
  }
});

test("mantiene la normalizzazione e rispetta la data esplicita anche se passata", () => {
  for (const expression of [
    "  LUNEDÌ   9 NOVEMBRE 2026  ", "il lunedì 9 novembre 2026", "del lunedì 9 novembre 2026 alle 9:30",
  ]) {
    assert.deepEqual(resolveTemporalExpression(expression, "2026-11-10"), {
      date: "2026-11-09", status: "resolved",
    });
  }
});

test("conserva il riconoscimento separato del giorno e della data testuale", () => {
  for (const expression of ["Lunedì", "9 novembre 2026", "9 novembre"]) {
    assert.deepEqual(resolveTemporalExpression(expression, referenceDate), {
      date: "2026-11-09", status: "resolved",
    });
  }
});

test("riconosce domani mattina senza inventare un orario", () => {
  assert.deepEqual(
    resolveTemporalExpression("domani mattina", referenceDate),
    {
      date: "2026-11-08",
      status: "resolved",
    },
  );
});
