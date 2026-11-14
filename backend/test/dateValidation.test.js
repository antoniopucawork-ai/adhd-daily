import assert from "node:assert/strict";
import test from "node:test";
import { resolveTemporalExpression } from "../services/dateValidation.js";

const referenceDate = "2026-11-07";

test("risolve le date esplicite con giorno della settimana coerente", () => {
  for (const [weekday, day] of [
    ["Lunedì", "09"],
    ["Martedì", "10"],
    ["Mercoledì", "11"],
    ["Giovedì", "12"],
    ["Venerdì", "13"],
    ["Sabato", "14"],
    ["Domenica", "15"],
  ]) {
    assert.deepEqual(
      resolveTemporalExpression(
        `${weekday} ${Number(day)} novembre 2026`,
        referenceDate,
      ),
      {
        date: `2026-11-${day}`,
        status: "resolved",
      },
    );
  }
});

test("rifiuta date inesistenti", () => {
  for (const expression of [
    "Lunedì 31 novembre 2026",
    "Lunedì 29 febbraio 2027",
  ]) {
    assert.deepEqual(resolveTemporalExpression(expression, referenceDate), {
      date: null,
      status: "unsupported",
    });
  }
});

test("mantiene la normalizzazione e rispetta la data esplicita anche se passata", () => {
  for (const expression of [
    "  LUNEDÌ   9 NOVEMBRE 2026  ",
    "il lunedì 9 novembre 2026",
    "del lunedì 9 novembre 2026 alle 9:30",
  ]) {
    assert.deepEqual(resolveTemporalExpression(expression, "2026-11-10"), {
      date: "2026-11-09",
      status: "resolved",
    });
  }
});

test("conserva il riconoscimento separato del giorno e della data testuale", () => {
  for (const expression of ["Lunedì", "9 novembre 2026", "9 novembre"]) {
    assert.deepEqual(resolveTemporalExpression(expression, referenceDate), {
      date: "2026-11-09",
      status: "resolved",
    });
  }
});

test("risolve weekday e numero soltanto quando coincidono con la prossima occorrenza", () => {
  for (const [expression, expected] of [
    ["martedì 17", "2026-11-17"],
    ["mercoledì 18", "2026-11-18"],
  ]) {
    assert.deepEqual(resolveTemporalExpression(expression, "2026-11-14"), {
      date: expected,
      status: "resolved",
    });
  }
  for (const expression of ["martedì 18", "mercoledì 17"]) {
    assert.deepEqual(resolveTemporalExpression(expression, "2026-11-14"), {
      date: null,
      status: "ambiguous",
    });
  }
});

test("rileva l'intera coppia weekday e numero e non sceglie tra alternative", async () => {
  const { findTemporalReferences } =
    await import("../services/dateValidation.js");

  assert.deepEqual(findTemporalReferences("mercoledi 18 alle 17"), [
    { start: 0, end: 12, expression: "mercoledi 18" },
  ]);
  assert.deepEqual(
    resolveTemporalExpression("martedì 17 oppure mercoledì 18", "2026-11-14"),
    { date: null, status: "ambiguous" },
  );
});

test("riconosce domani mattina senza inventare un orario", () => {
  assert.deepEqual(resolveTemporalExpression("domani mattina", referenceDate), {
    date: "2026-11-08",
    status: "resolved",
  });
});

test("non sposta automaticamente all'anno successivo una data senza anno già passata", () => {
  assert.deepEqual(resolveTemporalExpression("5 novembre", "2026-11-08"), {
    date: null,
    status: "ambiguous",
  });

  assert.deepEqual(resolveTemporalExpression("10 novembre", "2026-11-08"), {
    date: "2026-11-10",
    status: "resolved",
  });

  assert.deepEqual(resolveTemporalExpression("5 novembre 2026", "2026-11-08"), {
    date: "2026-11-05",
    status: "resolved",
  });

  assert.deepEqual(resolveTemporalExpression("2 gennaio", "2026-12-29"), {
    date: null,
    status: "ambiguous",
  });
});

for (const expression of [
  "domani, venerdì 13 novembre",
  "Domani (venerdì 13 novembre)",
  "venerdì, il 13 novembre",
  "13 novembre 2026, venerdì",
  "DOMANI, VENERDÌ 13 NOVEMBRE 2026 ALLE 16.",
  "domani, 13/11/2026",
  "domani, 2026-11-13",
]) {
  test(`data composta coerente: ${expression}`, () => {
    assert.deepEqual(resolveTemporalExpression(expression, "2026-11-12"), {
      date: "2026-11-13",
      status: "resolved",
    });
  });
}

for (const expression of [
  "domani, sabato 14 novembre",
  "martedì 13 novembre 2026",
  "domani, venerdì 13 novembre 2027",
  "oggi, domani",
]) {
  test(`riferimenti contraddittori: ${expression}`, () => {
    assert.deepEqual(resolveTemporalExpression(expression, "2026-11-12"), {
      date: null,
      status: "ambiguous",
    });
  });
}

test("la data esplicita ancora il weekday anche nel passato", () => {
  assert.deepEqual(
    resolveTemporalExpression("venerdì 13 novembre 2026", "2026-11-20"),
    {
      date: "2026-11-13",
      status: "resolved",
    },
  );
});

test("anno assente: niente rollover arbitrario, ma il relativo può ancorare il nuovo anno", () => {
  assert.deepEqual(
    resolveTemporalExpression("venerdì 1 gennaio", "2026-12-31"),
    {
      date: null,
      status: "ambiguous",
    },
  );
  assert.deepEqual(
    resolveTemporalExpression("domani, venerdì 1 gennaio", "2026-12-31"),
    {
      date: "2027-01-01",
      status: "resolved",
    },
  );
});

for (const clock of [
  "alle 16",
  "alle 16:30",
  "alle 16.30",
  "alle ore 16",
  "ore 16",
]) {
  test(`data composta separata dall'orario ${clock}`, () => {
    assert.deepEqual(
      resolveTemporalExpression(
        `domani ${clock}, sabato 14 novembre`,
        "2026-11-13",
      ),
      {
        date: "2026-11-14",
        status: "resolved",
      },
    );
    assert.deepEqual(
      resolveTemporalExpression(
        `domani ${clock}, venerdì 13 novembre`,
        "2026-11-13",
      ),
      {
        date: null,
        status: "ambiguous",
      },
    );
  });
}

test("un orario non collega date attraverso parole di un altro impegno", () => {
  assert.deepEqual(
    resolveTemporalExpression(
      "domani alle 16 ho il dentista, lunedì alle 18 chiamo Marco",
      "2026-11-13",
    ),
    {
      date: null,
      status: "unsupported",
    },
  );
});

for (const [expression, reference, expected] of [
  ["13 dicembre", "2026-11-13", "2026-12-13"],
  ["l'8 gennaio", "2026-11-13", "2027-01-08"],
  ["l’8 gennaio", "2026-11-13", "2027-01-08"],
  ["20 febbraio", "2026-11-13", "2027-02-20"],
  ["13 dicembre 2028", "2026-11-13", "2028-12-13"],
  ["8 gennaio", "2031-11-13", "2032-01-08"],
  ["29 febbraio", "2026-11-13", "2028-02-29"],
  ["venerdì 8 gennaio", "2026-11-13", "2027-01-08"],
  ["8 gennaio 2025", "2026-11-13", "2025-01-08"],
]) {
  test(`anno futuro autorizzato dal chiamante: ${expression} da ${reference}`, () => {
    assert.deepEqual(resolveTemporalExpression(expression, reference, true), {
      date: expected,
      status: "resolved",
    });
  });
}

test("l'opzione sull'anno non aggira date impossibili e contraddizioni", () => {
  assert.deepEqual(
    resolveTemporalExpression("31 febbraio", "2026-11-13", true),
    {
      date: null,
      status: "unsupported",
    },
  );
  assert.deepEqual(
    resolveTemporalExpression("giovedì 8 gennaio", "2026-11-13", true),
    {
      date: null,
      status: "ambiguous",
    },
  );
});
