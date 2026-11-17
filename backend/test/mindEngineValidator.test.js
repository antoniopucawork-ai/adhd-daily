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
  const result = validateItemDate(
    dentist,
    dentist.originalFragment,
    referenceDate,
  );
  assert.equal(result.date, "2026-11-06");
  assert.equal(result.time, "09:00");
  assert.equal(result.uncertain, false);
});

for (const [name, text, fields, expected] of [
  [
    "ora di un altro elemento",
    "Domani dentista alle 9, dopodomani palestra alle 18",
    { time: "18:00" },
    { date: "2026-11-06", time: null },
  ],
  [
    "data di un altro elemento",
    "Domani dentista alle 9, dopodomani palestra alle 18",
    { date: "2026-11-07", temporalExpression: "dopodomani" },
    { date: null, time: "09:00" },
  ],
  [
    "ora alternativa",
    "Domani dentista alle 18 o alle 19",
    { time: "18:00", originalFragment: "Domani dentista alle 18" },
    { date: "2026-11-06", time: null },
  ],
  [
    "seconda ora alternativa",
    "Domani dentista alle 18:00 o 19:00",
    { time: "19:00", originalFragment: "Domani dentista alle 18:00 o 19:00" },
    { date: "2026-11-06", time: null },
  ],
  [
    "giorno alternativo",
    "Dentista venerdì o lunedì",
    {
      originalFragment: "Dentista venerdì o lunedì",
      date: "2026-11-09",
      time: null,
      temporalExpression: "lunedì",
    },
    { date: null, time: null },
  ],
  [
    "anno omesso",
    "Dentista il 12 novembre 2027",
    {
      originalFragment: "Dentista il 12 novembre",
      date: "2026-11-12",
      time: null,
      temporalExpression: "12 novembre",
    },
    { date: null, time: null },
  ],
  [
    "orario troncato",
    "Domani dentista alle 18e30",
    { originalFragment: "Domani dentista alle 18e30", time: "18:00" },
    { date: "2026-11-06", time: null },
  ],
  [
    "data inventata",
    "Dentista",
    { originalFragment: "Dentista", time: null, temporalExpression: "Domani" },
    { date: null, time: null },
  ],
  [
    "frammento inventato",
    "Domani dentista alle 9",
    { originalFragment: "Domani dentista alle 9 e visita" },
    { date: null, time: null },
  ],
]) {
  test(name, () => {
    const result = validateItemDate(
      { ...dentist, ...fields },
      text,
      referenceDate,
    );
    assert.deepEqual({ date: result.date, time: result.time }, expected);
    assert.equal(result.uncertain, true);
  });
}

for (const [name, text, expectedTime, expectedUncertain] of [
  [
    "correzione certa",
    "Sabato 14 novembre alle 16 ho il dentista, anzi alle 17.",
    "17:00",
    false,
  ],
  [
    "orario alternativo",
    "Sabato 14 novembre alle 16 oppure alle 17 ho il dentista.",
    null,
    true,
  ],
  [
    "correzione incerta",
    "Sabato 14 novembre alle 16, anzi forse alle 17 ho il dentista.",
    null,
    true,
  ],
]) {
  test(`orario: ${name}`, () => {
    const result = validateItemDate(
      {
        type: "EVENT",
        title: "Dentista",
        originalFragment: text.slice(0, -1),
        date: "2026-11-14",
        time: "17:00",
        uncertain: false,
        temporalExpression: "Sabato 14 novembre",
      },
      text,
      "2026-11-13",
    );

    assert.equal(result.date, "2026-11-14");
    assert.equal(result.time, expectedTime);
    assert.equal(result.uncertain, expectedUncertain);
  });
}

test("mantiene l'anno esplicito, il giorno passato e l'azione senza data", () => {
  const items = [
    {
      ...dentist,
      originalFragment: "Dentista il 12 novembre 2027",
      date: "2027-11-12",
      temporalExpression: "12 novembre 2027",
      time: null,
    },
    {
      ...dentist,
      type: "MEMORY",
      title: "Incontro",
      originalFragment: "Ieri ho incontrato qualcuno",
      date: "2026-11-04",
      temporalExpression: "Ieri",
      time: null,
    },
    {
      ...dentist,
      type: "ACTION",
      title: "Comprare il latte",
      originalFragment: "comprare il latte",
      date: null,
      temporalExpression: null,
      time: null,
    },
  ];
  const result = validateItems(
    items,
    items.map((item) => item.originalFragment).join(", "),
    referenceDate,
  );
  assert.deepEqual(
    result.map(({ date, uncertain }) => [date, uncertain]),
    [
      ["2027-11-12", false],
      ["2026-11-04", false],
      [null, false],
    ],
  );
  assert.ok(result.every((item) => !Object.hasOwn(item, "originalFragment")));
});

test("due elementi con frammenti sovrapposti non ereditano la stessa evidenza", () => {
  const result = validateItems(
    [
      { ...dentist, originalFragment: "Domani dentista alle 9, palestra" },
      { ...dentist, title: "Palestra", originalFragment: "palestra" },
    ],
    "Domani dentista alle 9, palestra",
    referenceDate,
  );
  assert.ok(
    result.every(
      (item) => item.date === null && item.time === null && item.uncertain,
    ),
  );
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
    const result = validateItemDate(
      {
        ...dentist,
        title: "Palestra",
        originalFragment,
        time: proposed,
      },
      originalFragment,
      referenceDate,
    );

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
    const quotedDate = alternatives.startsWith(`il ${candidate} o`)
      ? `il ${candidate}`
      : alternatives;
    const otherFragment = "Palestra il 14/11/2026 alle 18.";
    const [ambiguous, independent] = validateItems(
      [
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
      ],
      `${originalFragment}. ${otherFragment}`,
      referenceDate,
    );

    assert.deepEqual(ambiguous, {
      type: "EVENT",
      title: "Dentista",
      date: null,
      time: "09:00",
      uncertain: true,
    });
    assert.deepEqual(independent, {
      type: "EVENT",
      title: "Palestra",
      date: "2026-11-14",
      time: "18:00",
      uncertain: false,
    });
  });
}

test("mantiene la data composta verificata e l'orario del singolo elemento", () => {
  const originalFragment = "Dentista Lunedì 9 novembre 2026 alle 9";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment,
      date: "2026-11-09",
      temporalExpression: "Lunedì 9 novembre 2026",
    },
    originalFragment,
    "2026-11-07",
  );
  assert.deepEqual(result, {
    type: "EVENT",
    title: "Dentista",
    date: "2026-11-09",
    time: "09:00",
    uncertain: false,
  });
});

for (const [name, text, fragment, expression, date] of [
  [
    "giorno contraddittorio",
    "Dentista Martedì 9 novembre 2026 alle 9",
    "Dentista Martedì 9 novembre 2026 alle 9",
    "Martedì 9 novembre 2026",
    "2026-11-09",
  ],
  [
    "data proposta errata",
    "Dentista Lunedì 9 novembre 2026 alle 9",
    "Dentista Lunedì 9 novembre 2026 alle 9",
    "Lunedì 9 novembre 2026",
    "2026-11-10",
  ],
  [
    "espressione inventata",
    "Dentista alle 9",
    "Dentista alle 9",
    "Lunedì 9 novembre 2026",
    "2026-11-09",
  ],
  [
    "data fuori dal frammento",
    "Dentista alle 9, palestra Lunedì 9 novembre 2026",
    "Dentista alle 9",
    "Lunedì 9 novembre 2026",
    "2026-11-09",
  ],
  [
    "prima data alternativa",
    "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9",
    "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9",
    "Lunedì 9 novembre 2026",
    "2026-11-09",
  ],
  [
    "seconda data alternativa",
    "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9",
    "Dentista Lunedì 9 novembre 2026 o Martedì 10 novembre 2026 alle 9",
    "Martedì 10 novembre 2026",
    "2026-11-10",
  ],
]) {
  test(`data composta: rifiuta ${name} e conserva l'orario verificato`, () => {
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment: fragment,
        date,
        temporalExpression: expression,
      },
      text,
      "2026-11-07",
    );
    assert.deepEqual(result, {
      type: "EVENT",
      title: "Dentista",
      date: null,
      time: "09:00",
      uncertain: true,
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
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment,
        time: proposed,
      },
      originalFragment,
      referenceDate,
    );

    assert.deepEqual(result, {
      type: "EVENT",
      title: "Dentista",
      date: "2026-11-06",
      time: expected,
      uncertain: expected === null,
    });
  });
}

for (const [text, fragment, proposed] of [
  ["Domani dentista alle 8 di sera", "Domani dentista alle 8", "08:00"],
  ["Domani dentista alle 8 di sera", "Domani dentista alle 8", "20:00"],
  [
    "Domani dentista alle 8 di mattina o di sera",
    "Domani dentista alle 8 di mattina o di sera",
    "08:00",
  ],
  [
    "Domani dentista alle 8 di mattina oppure di sera",
    "Domani dentista alle 8 di mattina",
    "08:00",
  ],
  [
    "Domani dentista alle 8 di mattina o alle 9 di sera",
    "Domani dentista alle 8 di mattina o alle 9 di sera",
    "08:00",
  ],
  [
    "Domani dentista alle 8 di mattina o alle 9 di sera",
    "Domani dentista alle 8 di mattina",
    "08:00",
  ],
  ["Domani dentista alle 8 di mattina o 9:00 di sera", "9:00 di sera", "21:00"],
]) {
  test(`qualificatori: citazione "${fragment}" non risolve l'ambiguità in "${text}" (${proposed})`, () => {
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment: fragment,
        time: proposed,
      },
      text,
      referenceDate,
    );
    assert.equal(result.time, null);
    assert.equal(result.uncertain, true);
    // Una citazione senza la data non deve ereditarla da altri frammenti.
    assert.equal(
      result.date,
      fragment.includes("Domani") ? "2026-11-06" : null,
    );
  });
}

test("qualificatori: mantiene l'incertezza preesistente e non inventa un orario assente", () => {
  const originalFragment = "Domani dentista alle 8 di sera";
  for (const [time, uncertain] of [
    ["20:00", true],
    [null, false],
  ]) {
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment,
        time,
        uncertain,
      },
      originalFragment,
      referenceDate,
    );
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
      {
        ...dentist,
        title: "Palestra",
        originalFragment: secondFragment,
        date: "2026-11-14",
        time: "18:00",
        temporalExpression: "14 novembre 2026",
      },
      {
        ...dentist,
        type: "ACTION",
        title: "Comprare il latte",
        originalFragment: "Devo comprare il latte",
        date: null,
        time: null,
        temporalExpression: null,
      },
    ];
    const snapshot = structuredClone(items);
    const result = validateItems(items, originalText, referenceDate);

    assert.deepEqual(result[0], {
      type: "EVENT",
      title: "Dentista",
      date: "2026-11-06",
      time: proposed === "20:00" ? "20:00" : null,
      uncertain: proposed !== "20:00",
    });
    assert.deepEqual(result.slice(1), [
      {
        type: "EVENT",
        title: "Palestra",
        date: "2026-11-14",
        time: "18:00",
        uncertain: false,
      },
      {
        type: "ACTION",
        title: "Comprare il latte",
        date: null,
        time: null,
        uncertain: false,
      },
    ]);
    assert.deepEqual(items, snapshot);
    assert.equal(
      originalText,
      `${firstFragment}. ${secondFragment}. Devo comprare il latte.`,
    );
  });
}

for (const originalFragment of [
  "Domani dentista ore 8:30 di sera",
  "Domani dentista alle ore 8:30 di sera",
  "Domani dentista 8:30 di sera",
  "DOMANI DENTISTA ALLE 8:30 DI SERA",
]) {
  test(`qualificatori: conserva formato e normalizzazione in "${originalFragment}"`, () => {
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment,
        time: "20:30",
      },
      originalFragment,
      referenceDate,
    );
    assert.deepEqual(result, {
      type: "EVENT",
      title: "Dentista",
      date: "2026-11-06",
      time: "20:30",
      uncertain: false,
    });
  });
}

const compoundReference = "2026-11-12";
for (const text of [
  "Domani, venerdì 13 novembre, alle 16 ho il dentista.",
  "Domani (venerdì 13 novembre 2026) alle 16 ho il dentista.",
]) {
  for (const expression of ["Domani", "venerdì", "13 novembre"]) {
    test(`verifica il contesto completo anche con evidenza parziale: ${text} / ${expression}`, () => {
      const result = validateItemDate(
        {
          ...dentist,
          originalFragment: text,
          date: "2026-11-13",
          time: "16:00",
          temporalExpression: expression,
        },
        text,
        compoundReference,
      );
      assert.deepEqual(result, {
        type: "EVENT",
        title: "Dentista",
        date: "2026-11-13",
        time: "16:00",
        uncertain: false,
      });
    });
  }
}

test("accetta anche la citazione temporale composta completa", () => {
  const text = "Domani, venerdì 13 novembre, alle 16 ho il dentista.";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: text,
      date: "2026-11-13",
      time: "16:00",
      temporalExpression: "Domani, venerdì 13 novembre",
    },
    text,
    compoundReference,
  );
  assert.equal(result.date, "2026-11-13");
  assert.equal(result.uncertain, false);
});

for (const [text, expression, date] of [
  [
    "Domani, sabato 14 novembre, alle 16 ho il dentista.",
    "Domani",
    "2026-11-13",
  ],
  [
    "Domani, sabato 14 novembre, alle 16 ho il dentista.",
    "14 novembre",
    "2026-11-14",
  ],
  [
    "Martedì 13 novembre 2026 alle 16 ho il dentista.",
    "13 novembre 2026",
    "2026-11-13",
  ],
  [
    "Domani, venerdì 13 novembre 2027 alle 16 ho il dentista.",
    "Domani",
    "2026-11-13",
  ],
]) {
  for (const truncated of [false, true]) {
    test(`non aggira contraddizioni con citazioni parziali: ${expression} / troncato ${truncated}`, () => {
      const result = validateItemDate(
        {
          ...dentist,
          originalFragment: truncated ? expression : text,
          date,
          time: truncated ? null : "16:00",
          temporalExpression: expression,
        },
        text,
        compoundReference,
      );
      assert.equal(result.date, null);
      assert.equal(result.time, truncated ? null : "16:00");
      assert.equal(result.uncertain, true);
    });
  }
}

for (const separator of [", ", ". ", "; "]) {
  test(`impegni indipendenti con separatore ${separator}`, () => {
    const first = "Domani alle 16 ho il dentista";
    const second = "venerdì alle 18 devo chiamare Marco";
    const items = [
      {
        ...dentist,
        originalFragment: first,
        date: "2026-11-12",
        time: "16:00",
      },
      {
        ...dentist,
        type: "ACTION",
        title: "Chiamare Marco",
        originalFragment: second,
        date: "2026-11-13",
        time: "18:00",
        temporalExpression: "venerdì",
      },
    ];
    const snapshot = structuredClone(items);
    const result = validateItems(
      items,
      first + separator + second,
      "2026-11-11",
    );
    assert.deepEqual(
      result.map(({ date, time, uncertain }) => ({ date, time, uncertain })),
      [
        { date: "2026-11-12", time: "16:00", uncertain: false },
        { date: "2026-11-13", time: "18:00", uncertain: false },
      ],
    );
    assert.deepEqual(items, snapshot);
    const swapped = validateItems(
      items.map((item, index) => ({
        ...item,
        date: items[1 - index].date,
        time: items[1 - index].time,
      })),
      first + separator + second,
      "2026-11-11",
    );
    assert.ok(
      swapped.every(
        (item) => item.date === null && item.time === null && item.uncertain,
      ),
    );
  });
}

for (const tail of [
  "anzi sabato alle 16",
  "anzi, sabato alle 16",
  "anzi il sabato alle 16",
]) {
  test(`correzione esplicita: ${tail}`, () => {
    const text = `Venerdì alle 16 ho il dentista, ${tail}`;
    for (const [expression, date, accepted] of [
      ["sabato", "2026-11-14", true],
      ["Venerdì", "2026-11-13", false],
    ]) {
      const result = validateItemDate(
        {
          ...dentist,
          originalFragment: text,
          date,
          time: "16:00",
          temporalExpression: expression,
        },
        text,
        compoundReference,
      );
      assert.equal(result.date, accepted ? date : null);
      assert.equal(result.time, "16:00");
      assert.equal(result.uncertain, !accepted);
    }
  });
}

for (const tail of [
  "anzi forse sabato alle 16",
  "o sabato alle 16",
  "oppure sabato alle 16",
]) {
  test(`non sceglie tra alternative o correzioni incerte: ${tail}`, () => {
    const text = `Venerdì alle 16 ho il dentista, ${tail}`;
    for (const [expression, date] of [
      ["Venerdì", "2026-11-13"],
      ["sabato", "2026-11-14"],
    ]) {
      const result = validateItemDate(
        {
          ...dentist,
          originalFragment: text,
          date,
          time: "16:00",
          temporalExpression: expression,
        },
        text,
        compoundReference,
      );
      assert.equal(result.date, null);
      assert.equal(result.uncertain, true);
    }
  });
}

test("una correzione fuori dalla citazione non conferma la data superata", () => {
  const fragment = "Venerdì alle 16 ho il dentista";
  const text = `${fragment}, anzi sabato alle 16`;
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: fragment,
      date: "2026-11-13",
      time: "16:00",
      temporalExpression: "Venerdì",
    },
    text,
    compoundReference,
  );
  assert.equal(result.date, null);
  assert.equal(result.uncertain, true);
});

test("non azzera l'incertezza preesistente su una data composta valida", () => {
  const text = "Domani, venerdì 13 novembre alle 16 ho il dentista";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: text,
      date: "2026-11-13",
      time: "16:00",
      temporalExpression: "Domani",
      uncertain: true,
    },
    text,
    compoundReference,
  );
  assert.equal(result.date, "2026-11-13");
  assert.equal(result.uncertain, true);
});

for (const expression of ["Venerdì, anzi sabato", "sabato"]) {
  test(`correzione citata per intero o solo nella parte finale: ${expression}`, () => {
    const text = "Dentista alle 16 venerdì, anzi sabato";
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment: text,
        date: "2026-11-14",
        time: "16:00",
        temporalExpression: expression,
      },
      text,
      compoundReference,
    );
    assert.equal(result.date, "2026-11-14");
    assert.equal(result.time, "16:00");
    assert.equal(result.uncertain, false);
  });
}

test("una correzione non coinvolge l'impegno indipendente successivo", () => {
  const first = "Venerdì alle 16 ho il dentista, anzi sabato alle 16";
  const second = "domenica alle 18 devo chiamare Marco";
  const result = validateItems(
    [
      {
        ...dentist,
        originalFragment: first,
        date: "2026-11-14",
        time: "16:00",
        temporalExpression: "sabato",
      },
      {
        ...dentist,
        originalFragment: second,
        type: "ACTION",
        title: "Chiamare Marco",
        date: "2026-11-15",
        time: "18:00",
        temporalExpression: "domenica",
      },
    ],
    `${first}, ${second}`,
    compoundReference,
  );
  assert.deepEqual(
    result.map(({ date, time, uncertain }) => [date, time, uncertain]),
    [
      ["2026-11-14", "16:00", false],
      ["2026-11-15", "18:00", false],
    ],
  );
});

test("il solo frammento finale non eredita una correzione incerta", () => {
  const text = "Dentista venerdì, anzi forse sabato alle 16";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: "sabato alle 16",
      date: "2026-11-14",
      time: "16:00",
      temporalExpression: "sabato",
    },
    text,
    compoundReference,
  );
  assert.equal(result.date, null);
  assert.equal(result.uncertain, true);
});

for (const expression of [
  "venerdì prossimo",
  "il venerdì prossimo",
  "venerdì della prossima settimana",
]) {
  test(`l'espansione del contesto non elimina qualificatori ambigui: ${expression}`, () => {
    const text = `Dentista ${expression} alle 16`;
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment: text,
        date: "2026-11-13",
        time: "16:00",
        temporalExpression: expression,
      },
      text,
      compoundReference,
    );
    assert.equal(result.date, null);
    assert.equal(result.time, "16:00");
    assert.equal(result.uncertain, true);
  });
}

for (const [clock, time] of [
  ["alle 16", "16:00"],
  ["alle 16:30", "16:30"],
  ["alle ore 16", "16:00"],
]) {
  for (const [day, proposedDate, expectedDate] of [
    ["sabato 14 novembre", "2026-11-14", "2026-11-14"],
    ["venerdì 13 novembre", "2026-11-14", null],
    ["venerdì 13 novembre", "2026-11-13", null],
  ]) {
    test(`orario tra riferimenti: ${clock}, ${day}, proposta ${proposedDate}`, () => {
      const text = `Domani ${clock}, ${day}, ho il dentista.`;
      const expression = proposedDate === "2026-11-13" ? day : "Domani";
      const item = {
        ...dentist,
        originalFragment: text,
        date: proposedDate,
        time,
        temporalExpression: expression,
      };
      const snapshot = structuredClone(item);
      const result = validateItemDate(item, text, "2026-11-13");
      assert.deepEqual(result, {
        type: item.type,
        title: item.title,
        date: expectedDate,
        time,
        uncertain: expectedDate === null,
      });
      assert.deepEqual(item, snapshot);
    });
  }
}

test("conserva la citazione completa e l'incertezza preesistente", () => {
  const text = "Domani alle 16, sabato 14 novembre, ho il dentista.";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: text,
      date: "2026-11-14",
      time: "16:00",
      uncertain: true,
      temporalExpression: "Domani alle 16, sabato 14 novembre",
    },
    text,
    "2026-11-13",
  );
  assert.equal(result.date, "2026-11-14");
  assert.equal(result.time, "16:00");
  assert.equal(result.uncertain, true);
});

test("due frammenti indipendenti non vengono uniti nemmeno se separati solo da un orario", () => {
  const first = "Dentista domani alle 16";
  const second = "lunedì devo chiamare Marco alle 18";
  const result = validateItems(
    [
      {
        ...dentist,
        originalFragment: first,
        date: "2026-11-14",
        time: "16:00",
        temporalExpression: "domani",
      },
      {
        ...dentist,
        originalFragment: second,
        type: "ACTION",
        title: "Chiamare Marco",
        date: "2026-11-16",
        time: "18:00",
        temporalExpression: "lunedì",
      },
    ],
    `${first}, ${second}`,
    "2026-11-13",
  );
  assert.deepEqual(
    result.map(({ date, time, uncertain }) => [date, time, uncertain]),
    [
      ["2026-11-14", "16:00", false],
      ["2026-11-16", "18:00", false],
    ],
  );
});

test("il raggruppamento con orario rispetta i confini tra frasi", () => {
  const first = "Dentista domani alle 16.";
  const second = "Lunedì chiamo Marco alle 18.";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: first,
      date: "2026-11-14",
      time: "16:00",
      temporalExpression: "domani",
    },
    `${first} ${second}`,
    "2026-11-13",
  );
  assert.deepEqual(result, {
    type: "EVENT",
    title: "Dentista",
    date: "2026-11-14",
    time: "16:00",
    uncertain: false,
  });
});
test("riconosce una visita futura a gennaio senza anno", () => {
  const item = {
    type: "EVENT",
    title: "Visita medica",
    originalFragment: "Ho una visita l'8 gennaio",
    date: "2027-01-08",
    time: null,
    uncertain: false,
    temporalExpression: "8 gennaio",
  };

  const result = validateItemDate(
    item,
    "Ho una visita l'8 gennaio",
    "2026-11-13",
  );

  assert.equal(result.date, "2027-01-08");
  assert.equal(result.uncertain, false);
});
test("non sposta un ricordo passato all'anno successivo", () => {
  const text = "Sono stato dal dentista l'8 gennaio";

  const item = {
    type: "MEMORY",
    title: "Visita dal dentista",
    originalFragment: text,
    date: "2027-01-08",
    time: null,
    uncertain: false,
    temporalExpression: "8 gennaio",
  };

  const result = validateItemDate(item, text, "2026-11-13");

  assert.equal(result.date, null);
  assert.equal(result.uncertain, true);
});
test("non trasforma un evento passato in uno futuro", () => {
  const text = "Sono stato dal dentista l'8 gennaio";

  const item = {
    type: "EVENT",
    title: "Dentista",
    originalFragment: text,
    date: "2027-01-08",
    time: null,
    uncertain: false,
    temporalExpression: "8 gennaio",
  };

  const result = validateItemDate(item, text, "2026-11-13");

  assert.equal(result.date, null);
  assert.equal(result.uncertain, true);
});

for (const [text, expression, date, time, uncertain] of [
  ["Il 13 dicembre ho il dentista", "13 dicembre", "2026-12-13", null, false],
  ["L'8 gennaio ho una visita", "L'8 gennaio", "2027-01-08", null, false],
  ["L’8 gennaio ho una visita", "L’8 gennaio", "2027-01-08", null, false],
  [
    "Il 20 febbraio devo fare un controllo",
    "20 febbraio",
    "2027-02-20",
    null,
    false,
  ],
  [
    "Il 13 dicembre 2028 ho una visita",
    "13 dicembre 2028",
    "2028-12-13",
    null,
    false,
  ],
  ["Domani alle 16 ho il dentista", "Domani", "2026-11-14", "16:00", false],
  ["Forse l'8 gennaio vado in palestra", "8 gennaio", "2027-01-08", null, true],
  [
    "Ho una visita venerdì 8 gennaio",
    "venerdì 8 gennaio",
    "2027-01-08",
    null,
    false,
  ],
  [
    "Ho una visita l'8 gennaio alle 16",
    "l'8 gennaio alle 16",
    "2027-01-08",
    "16:00",
    false,
  ],
]) {
  test(`contratto data e contesto: ${text}`, () => {
    const type = uncertain ? "INTENTION" : "EVENT";
    const item = {
      type,
      title: "Impegno",
      originalFragment: text,
      date,
      time,
      uncertain,
      temporalExpression: expression,
    };
    const snapshot = structuredClone(item);
    assert.deepEqual(validateItemDate(item, text, "2026-11-13"), {
      type,
      title: "Impegno",
      date,
      time,
      uncertain,
    });
    assert.deepEqual(item, snapshot);
  });
}

for (const type of ["MEMORY", "EVENT", "ACTION", "INTENTION", "THOUGHT"]) {
  for (const fragment of ["Sono stato dal dentista l'8 gennaio", "8 gennaio"]) {
    test(`il passato prevale sulla categoria ${type}, citazione ${fragment}`, () => {
      const text = "Sono stato dal dentista l'8 gennaio";
      const result = validateItemDate(
        {
          ...dentist,
          type,
          originalFragment: fragment,
          date: "2027-01-08",
          time: null,
          uncertain: false,
          temporalExpression: "8 gennaio",
        },
        text,
        "2026-11-13",
      );
      assert.deepEqual(result, {
        type,
        title: "Dentista",
        date: null,
        time: null,
        uncertain: true,
      });
    });
  }
}

for (const text of [
  "8 gennaio",
  "Ci penso per l'8 gennaio",
  "Ricordo la visita l'8 gennaio",
  "L'8 gennaio avevo una visita",
  "L'8 gennaio non ho una visita",
]) {
  test(`non attribuisce un anno futuro a un contesto passato o non affidabile: ${text}`, () => {
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment: text,
        date: "2027-01-08",
        time: null,
        temporalExpression: "8 gennaio",
      },
      text,
      "2026-11-13",
    );
    assert.equal(result.date, null);
    assert.equal(result.uncertain, true);
  });
}

test("un ricordo con anno esplicito conserva la data anche con categoria errata", () => {
  const text = "Sono stato dal dentista l'8 gennaio 2025";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: text,
      date: "2025-01-08",
      time: null,
      temporalExpression: "8 gennaio 2025",
    },
    text,
    "2026-11-13",
  );
  assert.deepEqual(result, {
    type: "EVENT",
    title: "Dentista",
    date: "2025-01-08",
    time: null,
    uncertain: false,
  });
});

test("il contesto passato di un elemento non blocca l'impegno futuro indipendente", () => {
  const past = "Sono stato dal dentista l'8 gennaio";
  const future = "l'8 gennaio ho una visita alle 16";
  const result = validateItems(
    [
      {
        ...dentist,
        originalFragment: past,
        date: "2027-01-08",
        time: null,
        temporalExpression: "8 gennaio",
      },
      {
        ...dentist,
        originalFragment: future,
        date: "2027-01-08",
        time: "16:00",
        temporalExpression: "8 gennaio",
      },
    ],
    `${past}, ${future}`,
    "2026-11-13",
  );
  assert.deepEqual(
    result.map(({ date, time, uncertain }) => [date, time, uncertain]),
    [
      [null, null, true],
      ["2027-01-08", "16:00", false],
    ],
  );
});

test("cambio d'anno dinamico e incertezza conservata", () => {
  const text = "Forse l'8 gennaio vado in palestra";
  const result = validateItemDate(
    {
      ...dentist,
      type: "INTENTION",
      originalFragment: text,
      date: "2032-01-08",
      time: null,
      uncertain: true,
      temporalExpression: "8 gennaio",
    },
    text,
    "2031-11-13",
  );
  assert.equal(result.date, "2032-01-08");
  assert.equal(result.uncertain, true);
});

test("le date composte restano contraddittorie anche con un contesto futuro", () => {
  const text = "Domani alle 16, venerdì 13 novembre, ho il dentista";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: text,
      date: "2026-11-14",
      time: "16:00",
      temporalExpression: "Domani",
    },
    text,
    "2026-11-13",
  );
  assert.deepEqual(result, {
    type: "EVENT",
    title: "Dentista",
    date: null,
    time: "16:00",
    uncertain: true,
  });
});

test("un pensiero senza riferimenti temporali non diventa incerto per i campi mancanti", () => {
  const text = "Devo comprare il latte";
  const result = validateItemDate(
    {
      ...dentist,
      type: "ACTION",
      originalFragment: text,
      date: null,
      time: null,
      temporalExpression: null,
    },
    text,
    "2026-11-13",
  );
  assert.deepEqual(result, {
    type: "ACTION",
    title: "Dentista",
    date: null,
    time: null,
    uncertain: false,
  });
});

test("non ricordo l'orario non invalida l'anno di un appuntamento futuro", () => {
  const text = "L'8 gennaio ho una visita, non ricordo l'orario";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: text,
      date: "2027-01-08",
      time: null,
      uncertain: true,
      temporalExpression: "8 gennaio",
    },
    text,
    "2026-11-13",
  );
  assert.deepEqual(result, {
    type: "EVENT",
    title: "Dentista",
    date: "2027-01-08",
    time: null,
    uncertain: true,
  });
});

test("non usa l'anno corrente per attribuire una data futura a un ricordo", () => {
  const text = "Sono stato dal dentista il 13 dicembre";
  const result = validateItemDate(
    {
      ...dentist,
      originalFragment: text,
      date: "2026-12-13",
      time: null,
      temporalExpression: "13 dicembre",
    },
    text,
    "2026-11-13",
  );
  assert.equal(result.date, null);
  assert.equal(result.uncertain, true);
});

for (const [text, expression, date] of [
  ["Il 13 dicembre cena con amici", "13 dicembre", "2026-12-13"],
  ["Il 20 novembre pago la bolletta", "20 novembre", "2026-11-20"],
]) {
  for (const uncertain of [false, true]) {
    test(`anno corrente senza parole chiave: ${text}, uncertain ${uncertain}`, () => {
      const item = {
        ...dentist,
        type: "ACTION",
        originalFragment: text,
        date,
        time: null,
        uncertain,
        temporalExpression: expression,
      };
      const snapshot = structuredClone(item);
      assert.deepEqual(validateItemDate(item, text, "2026-11-13"), {
        type: "ACTION",
        title: "Dentista",
        date,
        time: null,
        uncertain,
      });
      assert.deepEqual(item, snapshot);
    });
  }
}

for (const [text, expression, date] of [
  ["L'8 gennaio cena con amici", "8 gennaio", "2027-01-08"],
  ["Il 13 dicembre cena con amici", "13 dicembre", "2027-12-13"],
]) {
  test(`contesto sconosciuto non autorizza un anno successivo: ${text}`, () => {
    const result = validateItemDate(
      {
        ...dentist,
        originalFragment: text,
        date,
        time: null,
        temporalExpression: expression,
      },
      text,
      "2026-11-13",
    );
    assert.equal(result.date, null);
    assert.equal(result.uncertain, true);
  });
}

for (const [tail, expectedTime, expectedUncertain] of [
  ["anzi mercoledì 18 alle 17", "17:00", false],
  ["oppure alle 17", null, true],
  ["anzi forse alle 17", null, true],
]) {
  test(`orario dopo correzione con data: ${tail}`, () => {
    const text = `Martedì 17 alle 16 vado in banca, ${tail}`;
    const corrected = tail === "anzi mercoledì 18 alle 17";
    const result = validateItems(
      [
        {
          type: "EVENT",
          title: "Banca",
          originalFragment: text,
          date: corrected ? "2026-11-18" : "2026-11-17",
          time: "17:00",
          uncertain: false,
          temporalExpression: corrected ? "mercoledì 18" : "Martedì 17",
        },
      ],
      text,
      "2026-11-14",
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].date, corrected ? "2026-11-18" : "2026-11-17");
    assert.equal(result[0].time, expectedTime);
    assert.equal(result[0].uncertain, expectedUncertain);
  });
}

test("la correzione di data e ora mantiene due impegni distinti", () => {
  const first = "Martedì 17 alle 16 vado in banca, anzi mercoledì 18 alle 17";
  const second = "giovedì 19 alle 18 vado in palestra";
  const result = validateItems(
    [
      {
        ...dentist,
        title: "Banca",
        originalFragment: first,
        date: "2026-11-18",
        time: "17:00",
        temporalExpression: "mercoledì 18",
      },
      {
        ...dentist,
        title: "Palestra",
        originalFragment: second,
        date: "2026-11-19",
        time: "18:00",
        temporalExpression: "giovedì 19",
      },
    ],
    `${first}, ${second}`,
    "2026-11-14",
  );
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map(({ date, time, uncertain }) => [date, time, uncertain]),
    [
      ["2026-11-18", "17:00", false],
      ["2026-11-19", "18:00", false],
    ],
  );
});

test("conserva la risposta reale di Gemini con il solo frammento corretto", () => {
  const text = "Martedì 17 alle 16 vado in banca, anzi mercoledì 18 alle 17";
  const result = validateItems(
    [
      {
        type: "EVENT",
        title: "Andare in banca",
        originalFragment: "mercoledì 18 alle 17",
        temporalExpression: "mercoledì 18",
        date: "2026-11-18",
        time: "17:00",
        uncertain: false,
      },
    ],
    text,
    "2026-11-14",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].type, "EVENT");
  assert.equal(result[0].date, "2026-11-18");
  assert.equal(result[0].time, "17:00");
  assert.equal(result[0].uncertain, false);
});

test("non conferma l'orario se il frammento omette anzi forse", () => {
  const fragment = "Sabato 21 novembre alle 16 ho il dentista";
  const result = validateItems(
    [
      {
        type: "EVENT",
        title: "Dentista",
        originalFragment: fragment,
        temporalExpression: "Sabato 21 novembre",
        date: "2026-11-21",
        time: "16:00",
        uncertain: false,
      },
    ],
    `${fragment}, anzi forse alle 17, non sono sicuro.`,
    "2026-11-14",
  );
  assert.deepEqual(result, [
    {
      type: "EVENT",
      title: "Dentista",
      date: "2026-11-21",
      time: null,
      uncertain: true,
    },
  ]);
});

for (const suffix of [
  ".",
  ". Anzi forse alle 17 ho un altro impegno.",
  "; anzi forse alle 17 ho un altro impegno.",
  ", poi anzi forse alle 17 vado in palestra.",
  ", anzi forse alle 170.",
]) {
  test(`la continuazione non pertinente conserva l'orario: ${suffix}`, () => {
    const fragment = "Sabato 21 novembre alle 16 ho il dentista";
    const result = validateItems(
      [
        {
          type: "EVENT",
          title: "Dentista",
          originalFragment: fragment,
          temporalExpression: "Sabato 21 novembre",
          date: "2026-11-21",
          time: "16:00",
          uncertain: false,
        },
      ],
      fragment + suffix,
      "2026-11-14",
    );
    assert.deepEqual(result, [
      {
        type: "EVENT",
        title: "Dentista",
        date: "2026-11-21",
        time: "16:00",
        uncertain: false,
      },
    ]);
  });
}

test("la continuazione incerta si ferma al frammento di un altro elemento", () => {
  const first = "Sabato 21 novembre alle 16 ho il dentista";
  const second = "alle 17 vado in palestra";
  const text = `${first}, anzi forse ${second}`;
  const items = [
    {
      type: "EVENT",
      title: "Dentista",
      originalFragment: first,
      temporalExpression: "Sabato 21 novembre",
      date: "2026-11-21",
      time: "16:00",
      uncertain: false,
    },
    {
      type: "INTENTION",
      title: "Palestra",
      originalFragment: second,
      temporalExpression: null,
      date: null,
      time: "17:00",
      uncertain: true,
    },
  ];
  const expected = items.map(({ type, title, date, time, uncertain }) => ({
    type,
    title,
    date,
    time,
    uncertain,
  }));
  assert.deepEqual(validateItems(items, text, "2026-11-14"), expected);
  assert.deepEqual(
    validateItems([...items].reverse(), text, "2026-11-14"),
    [...expected].reverse(),
  );
});

test("correzione oraria dopo il punto: conserva la proposta finale", () => {
  const text = "Oggi ho il dentista alle 16. Anzi, alle 17.";
  const result = validateItems(
    [
      {
        type: "EVENT",
        title: "Dentista",
        originalFragment: text,
        temporalExpression: "Oggi",
        date: "2026-11-16",
        time: "17:00",
        uncertain: false,
      },
    ],
    text,
    "2026-11-16",
  );
  assert.deepEqual(result, [
    {
      type: "EVENT",
      title: "Dentista",
      date: "2026-11-16",
      time: "17:00",
      uncertain: false,
    },
  ]);
});

for (const [
  name,
  text,
  fragment,
  proposedTime,
  expectedTime,
  expectedUncertain,
] of [
  [
    "proposta superata con citazione completa",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "16:00",
    null,
    true,
  ],
  [
    "citazione iniziale senza punto",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "Oggi ho il dentista alle 16",
    "16:00",
    null,
    true,
  ],
  [
    "citazione iniziale con punto",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "Oggi ho il dentista alle 16.",
    "16:00",
    null,
    true,
  ],
  [
    "citazione iniziale e correzione nella stessa frase",
    "Oggi ho il dentista alle 16, anzi alle 17.",
    "Oggi ho il dentista alle 16",
    "16:00",
    null,
    true,
  ],
  [
    "proposta diversa dalla correzione",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "18:00",
    null,
    true,
  ],
  [
    "correzione incerta con citazione completa",
    "Oggi ho il dentista alle 16, anzi forse alle 17.",
    "Oggi ho il dentista alle 16, anzi forse alle 17.",
    "17:00",
    null,
    true,
  ],
  [
    "ora non valida nella continuazione",
    "Oggi ho il dentista alle 16. Anzi, alle 170.",
    "Oggi ho il dentista alle 16",
    "16:00",
    "16:00",
    false,
  ],
  [
    "orari con minuti separati da un punto",
    "Oggi ho il dentista alle 16.30. Anzi, alle 17.30.",
    "Oggi ho il dentista alle 16.30. Anzi, alle 17.30.",
    "17:30",
    "17:30",
    false,
  ],
  [
    "appuntamento senza correzione",
    "Oggi ho il dentista alle 16.",
    "Oggi ho il dentista alle 16.",
    "16:00",
    "16:00",
    false,
  ],
]) {
  test(`correzione oraria adiacente: ${name}`, () => {
    const result = validateItems(
      [
        {
          type: "EVENT",
          title: "Dentista",
          originalFragment: fragment,
          temporalExpression: "Oggi",
          date: "2026-11-16",
          time: proposedTime,
          uncertain: false,
        },
      ],
      text,
      "2026-11-16",
    );
    assert.deepEqual(result, [
      {
        type: "EVENT",
        title: "Dentista",
        date: "2026-11-16",
        time: expectedTime,
        uncertain: expectedUncertain,
      },
    ]);
  });
}

test("la correzione oraria adiacente rispetta i confini degli altri elementi", () => {
  const first = "Oggi alle 16 ho il dentista";
  const second = "Domani alle 10 ho una riunione, anzi alle 11";
  const items = [
    {
      type: "EVENT",
      title: "Dentista",
      originalFragment: first,
      temporalExpression: "Oggi",
      date: "2026-11-16",
      time: "16:00",
      uncertain: false,
    },
    {
      type: "EVENT",
      title: "Riunione",
      originalFragment: second,
      temporalExpression: "Domani",
      date: "2026-11-17",
      time: "11:00",
      uncertain: false,
    },
  ];
  const expected = [
    {
      type: "EVENT",
      title: "Dentista",
      date: "2026-11-16",
      time: "16:00",
      uncertain: false,
    },
    {
      type: "EVENT",
      title: "Riunione",
      date: "2026-11-17",
      time: "11:00",
      uncertain: false,
    },
  ];
  const text = `${first}. ${second}.`;
  assert.deepEqual(validateItems(items, text, "2026-11-16"), expected);
  assert.deepEqual(
    validateItems([...items].reverse(), text, "2026-11-16"),
    [...expected].reverse(),
  );
});

test("Anzi fuori citazione non usa l'orario del frammento di un altro impegno", () => {
  const first = "Oggi ho il dentista alle 16";
  const second = "alle 17 ho una riunione";
  const result = validateItems(
    [
      {
        type: "EVENT",
        title: "Dentista",
        originalFragment: first,
        temporalExpression: "Oggi",
        date: "2026-11-16",
        time: "16:00",
        uncertain: false,
      },
      {
        type: "EVENT",
        title: "Riunione",
        originalFragment: second,
        temporalExpression: null,
        date: null,
        time: "17:00",
        uncertain: false,
      },
    ],
    `${first}. Anzi, ${second}.`,
    "2026-11-16",
  );
  assert.deepEqual(result, [
    {
      type: "EVENT",
      title: "Dentista",
      date: "2026-11-16",
      time: "16:00",
      uncertain: false,
    },
    {
      type: "EVENT",
      title: "Riunione",
      date: null,
      time: "17:00",
      uncertain: false,
    },
  ]);
});

for (const [name, text, fragment, proposedTime] of [
  [
    "dubbio dopo l'orario",
    "Oggi ho il dentista alle 16. Anzi, alle 17, forse.",
    "Oggi ho il dentista alle 16. Anzi, alle 17, forse.",
    "17:00",
  ],
  [
    "orario interrogativo",
    "Oggi ho il dentista alle 16. Anzi, alle 17?",
    "Oggi ho il dentista alle 16. Anzi, alle 17?",
    "17:00",
  ],
  [
    "citazione troncata dopo Anzi",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "Oggi ho il dentista alle 16. Anzi,",
    "16:00",
  ],
  [
    "citazione troncata dopo alle",
    "Oggi ho il dentista alle 16. Anzi, alle 17.",
    "Oggi ho il dentista alle 16. Anzi, alle",
    "16:00",
  ],
  [
    "descrizione di un altro evento",
    "Oggi ho il dentista alle 16. Anzi, alle 17 ho una riunione",
    "Oggi ho il dentista alle 16. Anzi, alle 17 ho una riunione",
    "17:00",
  ],
  [
    "dubbio escluso dalla citazione",
    "Oggi ho il dentista alle 16. Anzi, alle 17, forse.",
    "Oggi ho il dentista alle 16. Anzi, alle 17",
    "17:00",
  ],
  [
    "stesso orario ma certezza non dimostrata",
    "Oggi ho il dentista alle 16. Anzi, alle 16?",
    "Oggi ho il dentista alle 16. Anzi, alle 16?",
    "16:00",
  ],
  [
    "citazione troncata dentro una correzione incerta",
    "Oggi ho il dentista alle 16, anzi forse alle 17.",
    "Oggi ho il dentista alle 16, anzi forse",
    "16:00",
  ],
]) {
  test(`sicurezza K5: ${name}`, () => {
    const result = validateItems(
      [
        {
          type: "EVENT",
          title: "Dentista",
          originalFragment: fragment,
          temporalExpression: "Oggi",
          date: "2026-11-16",
          time: proposedTime,
          uncertain: false,
        },
      ],
      text,
      "2026-11-16",
    );
    assert.deepEqual(result, [
      {
        type: "EVENT",
        title: "Dentista",
        date: "2026-11-16",
        time: null,
        uncertain: true,
      },
    ]);
  });
}
