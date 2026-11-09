import assert from "node:assert/strict";
import test from "node:test";
import { validateItems } from "../services/mindEngineValidator.js";

const validateItemDate = (item, text, referenceDate) =>
  validateItems([item], text, referenceDate)[0];

const referenceDate = "2026-11-05";
const dentist = {
  type: "EVENT",
  title: "Dentista",
  originalFragment: "Domani dentista alle 9",
  date: "2026-11-06",
  time: "09:00",
  uncertain: false,
  temporalExpression: "Domani",
};

test("mantiene data e ora supportate dal frammento", () => {
  const result = validateItemDate(dentist, dentist.originalFragment, referenceDate);
  assert.equal(result.date, "2026-11-06");
  assert.equal(result.time, "09:00");
  assert.equal(result.uncertain, false);
});

for (const [name, text, fields, expected] of [
  ["ora di un altro elemento", "Domani dentista alle 9, dopodomani palestra alle 18", { time: "18:00" }, { date: "2026-11-06", time: null }],
  ["data di un altro elemento", "Domani dentista alle 9, dopodomani palestra alle 18", { date: "2026-11-07", temporalExpression: "dopodomani" }, { date: null, time: "09:00" }],
  ["ora alternativa", "Domani dentista alle 18 o alle 19", { time: "18:00", originalFragment: "Domani dentista alle 18" }, { date: "2026-11-06", time: null }],
  ["seconda ora alternativa", "Domani dentista alle 18:00 o 19:00", { time: "19:00", originalFragment: "Domani dentista alle 18:00 o 19:00" }, { date: "2026-11-06", time: null }],
  ["giorno alternativo", "Dentista venerdì o lunedì", { originalFragment: "Dentista venerdì o lunedì", date: "2026-11-09", time: null, temporalExpression: "lunedì" }, { date: null, time: null }],
  ["anno omesso", "Dentista il 12 novembre 2027", { originalFragment: "Dentista il 12 novembre", date: "2026-11-12", time: null, temporalExpression: "12 novembre" }, { date: null, time: null }],
  ["orario troncato", "Domani dentista alle 18e30", { originalFragment: "Domani dentista alle 18e30", time: "18:00" }, { date: "2026-11-06", time: null }],
  ["data inventata", "Dentista", { originalFragment: "Dentista", time: null, temporalExpression: "Domani" }, { date: null, time: null }],
  ["frammento inventato", "Domani dentista alle 9", { originalFragment: "Domani dentista alle 9 e visita" }, { date: null, time: null }],
]) {
  test(name, () => {
    const result = validateItemDate({ ...dentist, ...fields }, text, referenceDate);
    assert.deepEqual({ date: result.date, time: result.time }, expected);
    assert.equal(result.uncertain, true);
  });
}

test("mantiene l'anno esplicito, il giorno passato e l'azione senza data", () => {
  const items = [
    { ...dentist, originalFragment: "Dentista il 12 novembre 2027", date: "2027-11-12", temporalExpression: "12 novembre 2027", time: null },
    { ...dentist, type: "MEMORY", title: "Incontro", originalFragment: "Ieri ho incontrato qualcuno", date: "2026-11-04", temporalExpression: "Ieri", time: null },
    { ...dentist, type: "ACTION", title: "Comprare il latte", originalFragment: "comprare il latte", date: null, temporalExpression: null, time: null },
  ];
  const result = validateItems(items, items.map((item) => item.originalFragment).join(", "), referenceDate);
  assert.deepEqual(result.map(({ date, uncertain }) => [date, uncertain]), [
    ["2027-11-12", false], ["2026-11-04", false], [null, false],
  ]);
  assert.ok(result.every((item) => !Object.hasOwn(item, "originalFragment")));
});

test("due elementi con frammenti sovrapposti non ereditano la stessa evidenza", () => {
  const result = validateItems([
    { ...dentist, originalFragment: "Domani dentista alle 9, palestra" },
    { ...dentist, title: "Palestra", originalFragment: "palestra" },
  ], "Domani dentista alle 9, palestra", referenceDate);
  assert.ok(result.every((item) => item.date === null && item.time === null && item.uncertain));
});

for (const [clock, proposed, expected] of [
  ["18.", "18:00", "18:00"],
  ["18.30.", "18:30", "18:30"],
  ["18:30", "18:30", "18:30"],
  ["18.30", "18:00", null],
  ["18.3", "18:00", null],
  ["18e30", "18:00", null],
]) {
  test(`verifica ${proposed} nel testo "alle ${clock}"`, () => {
    const originalFragment = `Domani palestra alle ${clock}`;
    const result = validateItemDate({
      ...dentist,
      title: "Palestra",
      originalFragment,
      time: proposed,
    }, originalFragment, referenceDate);

    assert.equal(result.date, "2026-11-06");
    assert.equal(result.time, expected);
    assert.equal(result.uncertain, expected === null);
  });
}

for (const [alternatives, candidate, day] of [
  ["il 12 o il 13 novembre 2026", "13 novembre 2026", "13"],
  ["il 12 novembre 2026 o il 13", "12 novembre 2026", "12"],
  ["il 12/11/2026 o il 13/11/2026", "12/11/2026", "12"],
  ["il 12/11/2026 o il 13/11/2026", "13/11/2026", "13"],
]) {
  test(`scarta la data alternativa ${candidate} e conserva gli altri dati`, () => {
    const originalFragment = `Dentista alle 9 ${alternatives}`;
    const quotedDate = alternatives.startsWith(`il ${candidate} o`) ? `il ${candidate}` : alternatives;
    const otherFragment = "Palestra il 14/11/2026 alle 18.";
    const [ambiguous, independent] = validateItems([
      {
        ...dentist,
        originalFragment: `Dentista alle 9 ${quotedDate}`,
        date: `2026-11-${day}`,
        temporalExpression: candidate,
      },
      {
        ...dentist,
        title: "Palestra",
        originalFragment: otherFragment,
        date: "2026-11-14",
        time: "18:00",
        temporalExpression: "14/11/2026",
      },
    ], `${originalFragment}. ${otherFragment}`, referenceDate);

    assert.deepEqual(ambiguous, {
      type: "EVENT", title: "Dentista", date: null, time: "09:00", uncertain: true,
    });
    assert.deepEqual(independent, {
      type: "EVENT", title: "Palestra", date: "2026-11-14", time: "18:00", uncertain: false,
    });
  });
}


test("mantiene la data composta verificata e l'orario del singolo elemento", () => {
  const originalFragment = "Dentista Lunedì 9 novembre 2026 alle 9";
  const result = validateItemDate({
    ...dentist, originalFragment, date: "2026-11-09", temporalExpression: "Lunedì 9 novembre 2026",
  }, originalFragment, "2026-11-07");
  assert.deepEqual(result, {
    type: "EVENT", title: "Dentista", date: "2026-11-09", time: "09:00", uncertain: false,
  });
});

for (const [name, text, fragment, expression, date] of [
  ["giorno contraddittorio", "Dentista Martedì 9 novembre 2026 alle 9", "Dentista Martedì 9 novembre 2026 alle 9", "Martedì 9 novembre 2026", "2026-11-09"],
  ["data proposta errata", "Dentista Lunedì 9 novembre 2026 alle 9", "Dentista Lunedì 9 novembre 2026 alle 9", "Lunedì 9 novembre 2026", "2026-11-10"],
  ["espressione inventata", "Dentista alle 9", "Dentista alle 9", "Lunedì 9 novembre 2026", "2026-11-09"],
  ["data fuori dal frammento", "Dentista alle 9, palestra Lunedì 9 novembre 2026", "Dentista alle 9", "Lunedì 9 novembre 2026", "2026-11-09"],
  ["prima data alternativa", "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9", "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9", "Lunedì 9 novembre 2026", "2026-11-09"],
  ["seconda data alternativa", "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9", "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9", "Martedì 10 novembre 2026", "2026-11-10"],
]) {
  test(`data composta: rifiuta ${name} e conserva l'orario verificato`, () => {
    const result = validateItemDate({
      ...dentist, originalFragment: fragment, date, temporalExpression: expression,
    }, text, "2026-11-07");
    assert.deepEqual(result, {
      type: "EVENT", title: "Dentista", date: null, time: "09:00", uncertain: true,
    });
  });
}


for (const [clock, proposed, expected] of [
  ["8", "08:00", "08:00"],
  ["20", "20:00", "20:00"],
  ["8 di mattina", "08:00", "08:00"],
  ["8 di mattina", "20:00", null],
  ["8 di sera", "20:00", "20:00"],
  ["8 di sera", "08:00", null],
  ["3 di pomeriggio", "15:00", "15:00"],
  ["3 di pomeriggio", "03:00", null],
  ["20 di sera", "20:00", "20:00"],
  ["15 di pomeriggio", "15:00", "15:00"],
  ["20 di mattina", "20:00", null],
  ["8:30 di sera", "20:30", "20:30"],
  ["8.30 di sera.", "20:30", "20:30"],
  ["8:30 di mattina", "08:30", "08:30"],
  ["3:15 di pomeriggio", "15:15", "15:15"],
  ["8:30 di sera", "20:00", null],
  ["12", "12:00", "12:00"],
  ["12", "00:00", null],
  ["12 di pomeriggio", "12:00", "12:00"],
  ["12 di pomeriggio", "00:00", null],
  ["12:30 di pomeriggio", "12:30", "12:30"],
  ["12 di mattina", "12:00", null],
  ["12 di mattina", "00:00", null],
  ["12:30 di mattina", "12:30", null],
  ["12:30 di mattina", "00:30", null],
  ["12 di sera", "12:00", null],
  ["12 di sera", "00:00", null],
  ["12:30 di sera", "00:30", null],
  ["12:30 di sera", "12:30", null],
  ["0", "00:00", "00:00"],
  ["0 di mattina", "00:00", "00:00"],
  ["0 di sera", "00:00", null],
]) {
  test(`qualificatori: "alle ${clock}" con proposta ${proposed}`, () => {
    const originalFragment = `Domani dentista alle ${clock}`;
    const result = validateItemDate({
      ...dentist, originalFragment, time: proposed,
    }, originalFragment, referenceDate);

    assert.deepEqual(result, {
      type: "EVENT", title: "Dentista", date: "2026-11-06",
      time: expected, uncertain: expected === null,
    });
  });
}

for (const [text, fragment, proposed] of [
  ["Domani dentista alle 8 di sera", "Domani dentista alle 8", "08:00"],
  ["Domani dentista alle 8 di sera", "Domani dentista alle 8", "20:00"],
  ["Domani dentista alle 8 di mattina o di sera", "Domani dentista alle 8 di mattina o di sera", "08:00"],
  ["Domani dentista alle 8 di mattina oppure di sera", "Domani dentista alle 8 di mattina", "08:00"],
  ["Domani dentista alle 8 di mattina o alle 9 di sera", "Domani dentista alle 8 di mattina o alle 9 di sera", "08:00"],
  ["Domani dentista alle 8 di mattina o alle 9 di sera", "Domani dentista alle 8 di mattina", "08:00"],
  ["Domani dentista alle 8 di mattina o 9:00 di sera", "9:00 di sera", "21:00"],
]) {
  test(`qualificatori: citazione "${fragment}" non risolve l'ambiguità in "${text}" (${proposed})`, () => {
    const result = validateItemDate({
      ...dentist, originalFragment: fragment, time: proposed,
    }, text, referenceDate);
    assert.equal(result.time, null);
    assert.equal(result.uncertain, true);
    // Una citazione senza la data non deve ereditarla da altri frammenti.
    assert.equal(result.date, fragment.includes("Domani") ? "2026-11-06" : null);
  });
}

test("qualificatori: mantiene l'incertezza preesistente e non inventa un orario assente", () => {
  const originalFragment = "Domani dentista alle 8 di sera";
  for (const [time, uncertain] of [["20:00", true], [null, false]]) {
    const result = validateItemDate({
      ...dentist, originalFragment, time, uncertain,
    }, originalFragment, referenceDate);
    assert.equal(result.time, time);
    assert.equal(result.uncertain, uncertain);
    assert.equal(result.date, "2026-11-06");
  }
});

for (const proposed of ["08:00", "20:00"]) {
  test(`qualificatori: proposta ${proposed} preserva gli altri elementi e gli input`, () => {
    const firstFragment = "Domani dentista alle 8 di sera";
    const secondFragment = "Palestra il 14 novembre 2026 alle 18";
    const originalText = `${firstFragment}. ${secondFragment}. Devo comprare il latte.`;
    const items = [
      { ...dentist, originalFragment: firstFragment, time: proposed },
      { ...dentist, title: "Palestra", originalFragment: secondFragment,
        date: "2026-11-14", time: "18:00", temporalExpression: "14 novembre 2026" },
      { ...dentist, type: "ACTION", title: "Comprare il latte", originalFragment: "Devo comprare il latte",
        date: null, time: null, temporalExpression: null },
    ];
    const snapshot = structuredClone(items);
    const result = validateItems(items, originalText, referenceDate);

    assert.deepEqual(result[0], {
      type: "EVENT", title: "Dentista", date: "2026-11-06",
      time: proposed === "20:00" ? "20:00" : null, uncertain: proposed !== "20:00",
    });
    assert.deepEqual(result.slice(1), [
      { type: "EVENT", title: "Palestra", date: "2026-11-14", time: "18:00", uncertain: false },
      { type: "ACTION", title: "Comprare il latte", date: null, time: null, uncertain: false },
    ]);
    assert.deepEqual(items, snapshot);
    assert.equal(originalText, `${firstFragment}. ${secondFragment}. Devo comprare il latte.`);
  });
}


for (const originalFragment of [
  "Domani dentista ore 8:30 di sera",
  "Domani dentista alle ore 8:30 di sera",
  "Domani dentista 8:30 di sera",
  "DOMANI DENTISTA ALLE 8:30 DI SERA",
]) {
  test(`qualificatori: conserva formato e normalizzazione in "${originalFragment}"`, () => {
    const result = validateItemDate({
      ...dentist, originalFragment, time: "20:30",
    }, originalFragment, referenceDate);
    assert.deepEqual(result, {
      type: "EVENT", title: "Dentista", date: "2026-11-06", time: "20:30", uncertain: false,
    });
  });
}
