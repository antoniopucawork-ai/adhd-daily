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
