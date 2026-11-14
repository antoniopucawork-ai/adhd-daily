// Giorni della settimana secondo JavaScript:
// domenica = 0, lunedì = 1, ... sabato = 6

const WEEKDAYS = {
  domenica: 0,
  lunedi: 1,
  martedi: 2,
  mercoledi: 3,
  giovedi: 4,
  venerdi: 5,
  sabato: 6,
};

const MONTHS = {
  gennaio: 1,
  febbraio: 2,
  marzo: 3,
  aprile: 4,
  maggio: 5,
  giugno: 6,
  luglio: 7,
  agosto: 8,
  settembre: 9,
  ottobre: 10,
  novembre: 11,
  dicembre: 12,
};

export const MONTH_NAMES = Object.keys(MONTHS).join("|");

const NUMBER_WORDS = {
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  undici: 11,
  dodici: 12,
  tredici: 13,
  quattordici: 14,
  quindici: 15,
  sedici: 16,
  diciassette: 17,
  diciotto: 18,
  diciannove: 19,
  venti: 20,
  trenta: 30,
};

const MAX_RELATIVE_DAYS = 365;

// Normalizza accenti, spazi e maiuscole
export const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Verifica che una data esista realmente
export const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(0);

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

// Crea una data UTC senza dipendere dal fuso locale
const parseUTCDate = (dateString) => {
  if (!isValidDate(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(0);

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return date;
};

// Formatta una data in YYYY-MM-DD
const formatUTCDate = (date) => {
  const year = String(date.getUTCFullYear()).padStart(4, "0");

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Crea una data ISO soltanto se esiste realmente
const createISODate = (year, month, day) => {
  const dateString = [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");

  return isValidDate(dateString) ? dateString : null;
};

// Aggiunge giorni utilizzando UTC
const addDays = (dateString, days) => {
  const date = parseUTCDate(dateString);

  if (!date || !Number.isInteger(days)) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + days);

  return formatUTCDate(date);
};

// Restituisce il giorno della settimana
export const getWeekdayFromDate = (dateString) => {
  const date = parseUTCDate(dateString);

  return date ? date.getUTCDay() : null;
};

// Calcola la prossima occorrenza di un giorno
const getNextWeekdayDate = (referenceDate, targetWeekday) => {
  const currentWeekday = getWeekdayFromDate(referenceDate);

  if (currentWeekday === null) {
    return null;
  }

  const daysUntil = (targetWeekday - currentWeekday + 7) % 7;

  return addDays(referenceDate, daysUntil);
};

// Risultati standard
const resolved = (date) => ({
  date,
  status: "resolved",
});

const ambiguous = () => ({
  date: null,
  status: "ambiguous",
});

const unsupported = () => ({
  date: null,
  status: "unsupported",
});

// Trova giorno e mese. allowNextYear permette la prima data futura valida,
// anche oltre un anno se il 29 febbraio richiede un anno bisestile.
const resolveDayAndMonth = (
  day,
  month,
  referenceDate,
  allowNextYear = false,
) => {
  const referenceYear = Number(referenceDate.slice(0, 4));

  // Cerchiamo la prossima data valida.
  // Il ciclo gestisce anche il 29 febbraio.
  for (
    let year = referenceYear;
    year <= Math.min(referenceYear + 8, 9999);
    year++
  ) {
    const candidate = createISODate(year, month, day);

    if (candidate !== null && candidate >= referenceDate) {
      const canResolve = year === referenceYear || allowNextYear;

      return canResolve ? resolved(candidate) : ambiguous();
    }
  }

  return unsupported();
};

// Riferimenti elementari: i gruppi adiacenti descrivono la stessa data.
// Le parole dell'impegno e i confini tra frasi separano riferimenti distinti.
const DATE_REFERENCE = [
  "\\d{4}-\\d{2}-\\d{2}",
  "\\d{1,2}/\\d{1,2}/\\d{4}",
  `\\d{1,2}\\s+(?:${MONTH_NAMES})(?:\\s+\\d{4})?`,
  `(?:${Object.keys(WEEKDAYS).join("|")})\\s+\\d{1,2}\\b(?!\\s+(?:${MONTH_NAMES})\\b)`,
  "(?:dopodomani|domani|oggi|ieri)(?:\\s+(?:mattina|pomeriggio|sera))?",
  ...Object.keys(WEEKDAYS),
].join("|");
// Un orario esplicito può comparire tra due riferimenti alla stessa data.
// Non attraversiamo verbi, alternative o punti di fine frase.
const dateConnector =
  /^[\s,():]*(?:(?:alle(?: ore)?|ore)\s+(?:[01]?\d|2[0-3])(?:[:.][0-5]\d)?[\s,():]*)?(?:(?:il|del)\s+|(?:l|dell)['’]\s*)?$/;

export function findTemporalReferences(text, fragments = []) {
  const pattern = new RegExp(
    `(?<![a-z0-9/\\-])(?:${DATE_REFERENCE})(?![a-z0-9/\\-])`,
    "g",
  );
  const groups = [];
  for (const match of text.matchAll(pattern)) {
    const previous = groups.at(-1);
    const end = match.index + match[0].length;
    const crossesItems =
      previous &&
      fragments.some(
        (left) =>
          left.start <= previous.start &&
          previous.end <= left.end &&
          fragments.some(
            (right) =>
              right !== left && right.start <= match.index && end <= right.end,
          ),
      );
    if (
      previous &&
      !crossesItems &&
      dateConnector.test(text.slice(previous.end, match.index))
    ) {
      previous.end = end;
      previous.expression = text.slice(previous.start, end);
    } else {
      groups.push({ start: match.index, end, expression: match[0] });
    }
  }
  return groups;
}

function resolveCompoundDate(expression, referenceDate, allowNextYear) {
  const pattern = new RegExp(`(?:${DATE_REFERENCE})`, "g");
  const parts = [...expression.matchAll(pattern)];
  if (parts.length < 2) return null;

  let end = 0;
  for (const part of parts) {
    if (!dateConnector.test(expression.slice(end, part.index))) return null;
    end = part.index + part[0].length;
  }
  if (!/^[\s,()]*$/.test(expression.slice(end))) return null;

  const terms = parts.map((part) => part[0]);
  const dates = terms.filter((term) => !Object.hasOwn(WEEKDAYS, term));
  // Un anno esplicito o un relativo può ancorare anche giorno e mese senza anno.
  const anchor =
    dates.find((term) => /\d{4}/.test(term)) ??
    dates.find((term) => /^(ieri|oggi|domani|dopodomani)\b/.test(term)) ??
    dates[0];
  if (!anchor) return ambiguous();
  const resolution = resolveTemporalExpression(
    anchor,
    referenceDate,
    allowNextYear,
  );
  if (resolution.status !== "resolved") return resolution;

  for (const term of terms) {
    if (Object.hasOwn(WEEKDAYS, term)) {
      if (getWeekdayFromDate(resolution.date) !== WEEKDAYS[term])
        return ambiguous();
      continue;
    }
    const dayMonth = term.match(new RegExp(`^(\\d{1,2})\\s+(${MONTH_NAMES})$`));
    const candidate = dayMonth
      ? createISODate(
          Number(resolution.date.slice(0, 4)),
          MONTHS[dayMonth[2]],
          Number(dayMonth[1]),
        )
      : resolveTemporalExpression(term, referenceDate, allowNextYear).date;
    if (candidate !== resolution.date) return ambiguous();
  }
  return resolution;
}

// Interpreta le espressioni temporali supportate
export const resolveTemporalExpression = (
  temporalExpression,
  referenceDate,
  allowNextYear = false,
) => {
  if (
    typeof temporalExpression !== "string" ||
    !temporalExpression.trim() ||
    !isValidDate(referenceDate)
  ) {
    return unsupported();
  }

  let expression = normalizeText(temporalExpression)
    .replace(/[.,;]+$/, "")
    .trim();

  // Rimuove soltanto un eventuale orario finale valido.
  // L'orario resta gestito dal campo time.
  const timeSuffix = /\s+alle\s+(?:[01]?\d|2[0-3])(?:[:.][0-5]\d)?$/;

  expression = expression.replace(timeSuffix, "").trim();

  // Rimuove un eventuale articolo iniziale
  // nelle date esplicite.
  expression = expression.replace(/^(?:(?:il|del)\s+|(?:l|dell)['’]\s*)/, "");

  const compound = resolveCompoundDate(
    expression,
    referenceDate,
    allowNextYear,
  );
  if (compound) return compound;

  // Riconosce le espressioni ambigue
  // prima di interpretare i singoli giorni.
  // Riconosce le espressioni ambigue
  // prima di interpretare i singoli giorni.
  if (
    /\bprossim[oaie]\b/.test(expression) ||
    /\bsettimana\b/.test(expression) ||
    /\b(?:lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)(?:\s+\d{1,2})?\s+(?:o|oppure)\s+(?:lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)(?:\s+\d{1,2})?\b/.test(
      expression,
    )
  ) {
    return ambiguous();
  }

  // Ieri, oggi, domani, dopodomani
  const relativeDays = {
    ieri: -1,
    oggi: 0,
    domani: 1,
    dopodomani: 2,
  };

  if (Object.hasOwn(relativeDays, expression)) {
    return resolved(addDays(referenceDate, relativeDays[expression]));
  }
  // Riconosce il momento della giornata senza inventare un orario.
  const dayPeriodMatch = expression.match(
    /^(ieri|oggi|domani|dopodomani)\s+(mattina|pomeriggio|sera)$/,
  );

  if (dayPeriodMatch) {
    return resolved(addDays(referenceDate, relativeDays[dayPeriodMatch[1]]));
  }
  // Giorni della settimana
  if (Object.hasOwn(WEEKDAYS, expression)) {
    return resolved(getNextWeekdayDate(referenceDate, WEEKDAYS[expression]));
  }

  const weekdayAndDay = expression.match(
    new RegExp(`^(${Object.keys(WEEKDAYS).join("|")})\\s+(\\d{1,2})$`),
  );
  if (weekdayAndDay) {
    const [, weekday, day] = weekdayAndDay;
    const candidate = getNextWeekdayDate(referenceDate, WEEKDAYS[weekday]);
    return Number(candidate.slice(8, 10)) === Number(day)
      ? resolved(candidate)
      : ambiguous();
  }

  // "Tra tre giorni", "fra 5 giorni"
  const relativeMatch = expression.match(
    /^(?:tra|fra)\s+(\d+|[a-z]+)\s+giorni?$/,
  );

  if (relativeMatch) {
    const rawNumber = relativeMatch[1];

    const days = /^\d+$/.test(rawNumber)
      ? Number(rawNumber)
      : NUMBER_WORDS[rawNumber];

    if (!Number.isInteger(days) || days < 1 || days > MAX_RELATIVE_DAYS) {
      return unsupported();
    }

    return resolved(addDays(referenceDate, days));
  }

  // Date ISO: 2026-11-12
  const isoMatch = expression.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const date = expression;

    return isValidDate(date) ? resolved(date) : unsupported();
  }

  // Date numeriche italiane: 12/11/2026
  const numericMatch = expression.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (numericMatch) {
    const [, day, month, year] = numericMatch.map(Number);

    const date = createISODate(year, month, day);

    return date ? resolved(date) : unsupported();
  }

  // Date testuali:
  // "12 novembre"
  // "12 novembre 2026"
  const textualMatch = expression.match(
    new RegExp(`^(\\d{1,2})\\s+(${MONTH_NAMES})(?:\\s+(\\d{4}))?$`),
  );

  if (textualMatch) {
    const day = Number(textualMatch[1]);
    const month = MONTHS[textualMatch[2]];

    // Anno indicato esplicitamente
    if (textualMatch[3]) {
      const year = Number(textualMatch[3]);

      const date = createISODate(year, month, day);

      return date ? resolved(date) : unsupported();
    }

    // Il chiamante autorizza il cambio d'anno solo con evidenza di un impegno futuro.
    return resolveDayAndMonth(day, month, referenceDate, allowNextYear);
  }

  return unsupported();
};
