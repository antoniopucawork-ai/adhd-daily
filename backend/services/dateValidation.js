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
const normalizeText = (text) =>
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

// Trova la prossima occorrenza di giorno e mese
const resolveDayAndMonth = (day, month, referenceDate) => {
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
      return resolved(candidate);
    }
  }

  return unsupported();
};

// Interpreta le espressioni temporali supportate
export const resolveTemporalExpression = (
  temporalExpression,
  referenceDate,
) => {
  if (
    typeof temporalExpression !== "string" ||
    !temporalExpression.trim() ||
    !isValidDate(referenceDate)
  ) {
    return unsupported();
  }

  let expression = normalizeText(temporalExpression);

  // Rimuove soltanto un eventuale orario finale valido.
  // L'orario resta gestito dal campo time.
  const timeSuffix = /\s+alle\s+(?:[01]?\d|2[0-3])(?:[:.][0-5]\d)?$/;

  expression = expression.replace(timeSuffix, "").trim();

  // Rimuove un eventuale articolo iniziale
  // nelle date esplicite.
  expression = expression.replace(/^(?:il|del)\s+/, "");

  // Riconosce le espressioni ambigue
  // prima di interpretare i singoli giorni.
  if (
    /\bprossim[oaie]\b/.test(expression) ||
    /\bsettimana\b/.test(expression) ||
    /\b(?:lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)\s+o\s+(?:lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)\b/.test(
      expression,
    )
  ) {
    return ambiguous();
  }

  // Oggi, domani, dopodomani
  const relativeDays = {
    oggi: 0,
    domani: 1,
    dopodomani: 2,
  };

  if (Object.hasOwn(relativeDays, expression)) {
    return resolved(addDays(referenceDate, relativeDays[expression]));
  }

  // Giorni della settimana
  if (Object.hasOwn(WEEKDAYS, expression)) {
    return resolved(getNextWeekdayDate(referenceDate, WEEKDAYS[expression]));
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
  const monthNames = Object.keys(MONTHS).join("|");

  const textualMatch = expression.match(
    new RegExp(`^(\\d{1,2})\\s+(${monthNames})(?:\\s+(\\d{4}))?$`),
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

    // Anno assente: prossima occorrenza futura
    return resolveDayAndMonth(day, month, referenceDate);
  }

  return unsupported();
};

// Controlla la coerenza della data Gemini
export const validateTemporalConsistency = (
  dateString,
  temporalExpression,
  referenceDate,
) => {
  if (dateString !== null && !isValidDate(dateString)) {
    return {
      valid: false,
      reason: "Data inesistente o non valida",
    };
  }

  const resolution = resolveTemporalExpression(
    temporalExpression,
    referenceDate,
  );

  if (resolution.status === "ambiguous") {
    return {
      valid: dateString === null,
      reason: dateString === null ? null : "Espressione temporale ambigua",
    };
  }

  if (resolution.status === "unsupported") {
    return {
      valid: dateString === null,
      reason:
        dateString === null ? null : "Espressione temporale non verificabile",
    };
  }

  if (dateString !== resolution.date) {
    return {
      valid: false,
      reason: "La data non corrisponde all'espressione temporale",
    };
  }

  return {
    valid: true,
    reason: null,
  };
};
