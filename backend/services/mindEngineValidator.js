import {
  isValidDate,
  resolveTemporalExpression,
  validateTemporalConsistency,
} from "./dateValidation.js";

const WEEKDAYS = [
  "lunedi",
  "martedi",
  "mercoledi",
  "giovedi",
  "venerdi",
  "sabato",
  "domenica",
];

const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Verifica la presenza dell'espressione completa.
// Non accettiamo una sottostringa di un'altra parola.
function isTemporalExpressionInText(originalText, expression) {
  if (
    typeof originalText !== "string" ||
    typeof expression !== "string" ||
    !expression.trim()
  ) {
    return false;
  }

  const text = normalizeText(originalText);
  const term = normalizeText(expression);

  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(term)}(?![a-z0-9])`);

  return pattern.test(text);
}

// Impedisce di accettare un giorno isolato quando
// nel testo è accompagnato da un qualificatore.
//
// Esempio:
// Testo: "venerdì prossimo"
// Gemini: temporalExpression = "venerdì"
// Risultato: l'espressione non è considerata affidabile.
function isShortenedWeekday(originalText, expression) {
  const text = normalizeText(originalText);
  const weekday = normalizeText(expression);

  if (!WEEKDAYS.includes(weekday)) {
    return false;
  }

  const qualifiers =
    "(?:prossim\\w*|scors\\w*|passat\\w*|ventur\\w*|quest\\w*)";

  const otherWeekdays = WEEKDAYS.join("|");

  const suffixPattern = new RegExp(
    `\\b${weekday}\\s+(?:${qualifiers}|o\\s+(?:${otherWeekdays}))\\b`,
  );

  const prefixPattern = new RegExp(`\\b${qualifiers}\\s+${weekday}\\b`);

  return suffixPattern.test(text) || prefixPattern.test(text);
}

// Controlla che un orario sia effettivamente
// riconoscibile nel testo originale.
//
// Sono supportati:
// "18:30", "18.30", "alle 18", "ore 18".
//
// Le forme non riconosciute restano da chiarire.
function isTimeSupportedByText(time, originalText) {
  if (time === null) {
    return true;
  }

  if (
    typeof time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    typeof originalText !== "string"
  ) {
    return false;
  }

  const text = normalizeText(originalText);
  const [hours, minutes] = time.split(":");
  const hour = Number(hours);

  // Orario completo, ad esempio 18:30 oppure 18.30.
  const fullTimePattern = new RegExp(`(?<!\\d)0?${hour}[:.]${minutes}(?!\\d)`);

  if (fullTimePattern.test(text)) {
    return true;
  }

  // "Alle 18" equivale a 18:00, non a 18:30.
  if (minutes === "00") {
    const hourOnlyPattern = new RegExp(
      `\\b(?:alle\\s+ore|alle|ore)\\s+0?${hour}(?![\\d:.])`,
    );

    return hourOnlyPattern.test(text);
  }

  return false;
}

const markDateAsUncertain = (item) => ({
  ...item,
  date: null,
  uncertain: true,
});

// Validazione finale degli elementi prodotti da Gemini.
export const validateItemDate = (item, originalText, referenceDate) => {
  const validatedItem = {
    type: item.type,
    title: item.title.trim(),
    date: item.date,
    time: item.time,
    uncertain: item.uncertain,
  };

  // PRIMO CONTROLLO: ORARIO

  if (!isTimeSupportedByText(item.time, originalText)) {
    validatedItem.time = null;
    validatedItem.uncertain = true;
  }

  // SECONDO CONTROLLO: DATA

  const temporalExpression = item.temporalExpression;

  // Gemini ha indicato una data senza citare
  // alcuna espressione temporale dell'utente.
  if (temporalExpression === null) {
    if (item.date !== null) {
      return markDateAsUncertain(validatedItem);
    }

    return validatedItem;
  }

  // Verifichiamo che l'espressione esista nel testo.
  if (!isTemporalExpressionInText(originalText, temporalExpression)) {
    return markDateAsUncertain(validatedItem);
  }

  // Verifichiamo che Gemini non abbia eliminato
  // un qualificatore importante dal giorno.
  if (isShortenedWeekday(originalText, temporalExpression)) {
    return markDateAsUncertain(validatedItem);
  }

  if (!isValidDate(referenceDate)) {
    return markDateAsUncertain(validatedItem);
  }

  const resolution = resolveTemporalExpression(
    temporalExpression,
    referenceDate,
  );

  // Se il validatore non conosce l'espressione,
  // non accettiamo una data ipotizzata da Gemini.
  if (resolution.status !== "resolved") {
    return markDateAsUncertain(validatedItem);
  }

  if (item.date === null || !isValidDate(item.date)) {
    return markDateAsUncertain(validatedItem);
  }

  const validation = validateTemporalConsistency(
    item.date,
    temporalExpression,
    referenceDate,
  );

  if (!validation.valid) {
    return markDateAsUncertain(validatedItem);
  }

  return validatedItem;
};
