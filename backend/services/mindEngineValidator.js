import {
  isValidDate,
  resolveTemporalExpression,
  validateTemporalConsistency,
} from "./dateValidation.js";

// Normalizza il testo per confrontare le espressioni temporali
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Verifica che l'espressione temporale
// sia effettivamente presente nel testo originale
const isTemporalExpressionInText = (originalText, temporalExpression) => {
  if (
    typeof originalText !== "string" ||
    typeof temporalExpression !== "string" ||
    !temporalExpression.trim()
  ) {
    return false;
  }

  const normalizedOriginal = normalizeText(originalText);
  const normalizedExpression = normalizeText(temporalExpression);

  return normalizedOriginal.includes(normalizedExpression);
};

// Restituisce un elemento senza data,
// segnalando che è necessaria una verifica
const markDateAsUncertain = (item) => ({
  ...item,
  date: null,
  uncertain: true,
});

// Valida un elemento restituito da Gemini
export const validateItemDate = (item, originalText, referenceDate) => {
  // Manteniamo soltanto i campi utilizzati dal frontend
  const validatedItem = {
    type: item.type,
    title: item.title.trim(),
    date: item.date,
    time: item.time,
    uncertain: item.uncertain,
  };

  const temporalExpression = item.temporalExpression;

  // Nessuna espressione temporale identificata
  if (temporalExpression === null) {
    // Gemini non deve assegnare date prive di riferimento
    if (item.date !== null) {
      return markDateAsUncertain(validatedItem);
    }

    return validatedItem;
  }

  // L'espressione deve comparire nel testo originale
  if (!isTemporalExpressionInText(originalText, temporalExpression)) {
    return markDateAsUncertain(validatedItem);
  }

  // Verifica che la data di riferimento sia valida
  if (!isValidDate(referenceDate)) {
    return markDateAsUncertain(validatedItem);
  }

  // Interpreta l'espressione temporale
  const resolution = resolveTemporalExpression(
    temporalExpression,
    referenceDate,
  );

  // Espressione ambigua
  if (resolution.status === "ambiguous") {
    return markDateAsUncertain(validatedItem);
  }

  // Espressione non supportata dal validatore
  if (resolution.status === "unsupported") {
    return markDateAsUncertain(validatedItem);
  }

  // Gemini non ha restituito una data,
  // nonostante l'espressione sia determinabile
  if (item.date === null) {
    return markDateAsUncertain(validatedItem);
  }

  // Verifica che la data esista realmente
  if (!isValidDate(item.date)) {
    return markDateAsUncertain(validatedItem);
  }

  // Controlla che la data corrisponda
  // all'espressione temporale originale
  const validation = validateTemporalConsistency(
    item.date,
    temporalExpression,
    referenceDate,
  );

  if (!validation.valid) {
    return markDateAsUncertain(validatedItem);
  }

  // Tutti i controlli disponibili sono superati
  return validatedItem;
};
