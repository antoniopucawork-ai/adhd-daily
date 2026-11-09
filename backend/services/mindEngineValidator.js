import { MONTH_NAMES, normalizeText, resolveTemporalExpression } from "./dateValidation.js";

const WORD = "[a-z0-9]";
const WEEKDAY = "(?:lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)";
const QUALIFIER = "(?:prossim|scors|passat|ventur|quest)\\w*";
const TEXTUAL_DATE = `\\d{1,2}\\s+(?:${MONTH_NAMES})(?:\\s+\\d{4})?`;
const NUMERIC_DATE = "(?:\\d{1,2}/\\d{1,2}/\\d{4}|\\d{4}-\\d{2}-\\d{2})";
const DATE_ALTERNATIVE = `${WEEKDAY}|ieri|oggi|domani|dopodomani|${NUMERIC_DATE}|${TEXTUAL_DATE}`;
const ALTERNATIVE = "(?:o|oppure)";
const HOUR = "(?:[01]?\\d|2[0-3])";
const CLOCK = `(?:${HOUR}(?:[:.][0-5]\\d)?)`;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function findLiteralMatches(text, value) {
  const literal = escapeRegExp(value);
  return [...text.matchAll(new RegExp(`(?<!${WORD})${literal}(?!${WORD})`, "g"))];
}

function findFragment(text, value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const fragment = normalizeText(value);
  const [match, duplicate] = findLiteralMatches(text, fragment);
  if (!match || duplicate) return null;

  return { start: match.index, end: match.index + fragment.length };
}

function isWithin(fragment, start, end) {
  return fragment && fragment.start <= start && end <= fragment.end;
}

function isDateSupported(date, expression, text, fragment, referenceDate) {
  if (!fragment || date === null || typeof expression !== "string") return false;

  const term = normalizeText(expression);
  if (!term) return false;

  const resolution = resolveTemporalExpression(term, referenceDate);
  if (resolution.status !== "resolved" || date !== resolution.date) return false;

  const matches = findLiteralMatches(text, term).filter((match) =>
    isWithin(fragment, match.index, match.index + term.length),
  );
  if (matches.length !== 1) return false;

  const start = matches[0].index;
  const before = text.slice(0, start);
  const after = text.slice(start + term.length);

  // Controlla anche il testo vicino alla citazione, nel caso in cui Gemini l’abbia troncata.
  if (/^\s+\d{4}\b/.test(after) || /\d[/-]$/.test(before) || /^[/-]\d/.test(after)) {
    return false;
  }

  const bareWeekday = new RegExp(`^${WEEKDAY}$`).test(term);
  if (bareWeekday &&
      (new RegExp(`\\b${QUALIFIER}\\s+$`).test(before) ||
       new RegExp(`^\\s+${QUALIFIER}\\b`).test(after))) {
    return false;
  }

  // Una data testuale può condividere mese e anno con l'altro giorno.
  const sharedMonth = new RegExp(`^(?:(?:il|del)\\s+)?${TEXTUAL_DATE}$`).test(term);
  const alternatives = sharedMonth ? `${DATE_ALTERNATIVE}|\\d{1,2}` : DATE_ALTERNATIVE;
  const alternativeDate = `(?:(?:il|del)\\s+)?(?:${alternatives})\\b(?![.:/-]\\d)`;

  return !new RegExp(`\\b${alternativeDate}\\s+${ALTERNATIVE}\\s+(?:(?:il|del)\\s+)?$`).test(before) &&
    !new RegExp(`^\\s+${ALTERNATIVE}\\s+${alternativeDate}`).test(after);
}

function isTimeSupported(time, text, fragment) {
  if (!fragment) return false;

  const periodPattern = "(?:mattina|pomeriggio|sera)";
  const clockPattern = new RegExp(
    `(?<![a-z0-9.])(?:(?:alle(?: ore)?|ore)\\s+(${HOUR})(?:[:.]([0-5]\\d))?|(${HOUR})[:.]([0-5]\\d))(?![a-z0-9:]|\\.\\d)(?:\\s+di\\s+(${periodPattern})\\b)?`,
    "g",
  );

  // Il qualificatore fa parte dell'evidenza: non accettiamo citazioni troncate.
  const matches = [...text.matchAll(clockPattern)].filter((match) =>
    isWithin(fragment, match.index, match.index + match[0].length),
  );
  const times = new Set(matches.map(([, hour, minutes, bareHour, bareMinutes, period]) => {
    let supportedHour = Number(hour ?? bareHour);
    if (period === "mattina") {
      // Le dodici di mattina non distinguono con sicurezza mezzogiorno e mezzanotte.
      if (supportedHour >= 12) return null;
    } else if (period) {
      if (supportedHour === 0 || (supportedHour === 12 && period === "sera")) return null;
      if (supportedHour < 12) supportedHour += 12;
    }
    return `${String(supportedHour).padStart(2, "0")}:${minutes ?? bareMinutes ?? "00"}`;
  }));
  if (times.has(null) || times.size !== 1 || !times.has(time)) return false;

  const qualifiedClock = `${CLOCK}(?:\\s+di\\s+${periodPattern}\\b)?`;
  const alternativeBefore = new RegExp(`\\b${qualifiedClock}\\s+${ALTERNATIVE}\\s+$`);
  const alternativeAfter = new RegExp(
    `^\\s+${ALTERNATIVE}\\s+(?:(?:alle(?: ore)?|ore)\\s+)?${CLOCK}\\b`,
  );
  const alternativePeriodAfter = new RegExp(
    `^\\s+${ALTERNATIVE}\\s+(?:di\\s+)?${periodPattern}\\b`,
  );

  return matches.every((match) =>
    !alternativeBefore.test(text.slice(0, match.index)) &&
    !alternativeAfter.test(text.slice(match.index + match[0].length)) &&
    !(match[5] && alternativePeriodAfter.test(text.slice(match.index + match[0].length))),
  );
}

function validateWithFragment(item, text, fragment, referenceDate) {
  const { type, title, temporalExpression } = item;
  let { date, time, uncertain } = item;

  if ((date !== null || temporalExpression !== null) &&
      !isDateSupported(date, temporalExpression, text, fragment, referenceDate)) {
    date = null;
    uncertain = true;
  }

  if (time !== null && !isTimeSupported(time, text, fragment)) {
    time = null;
    uncertain = true;
  }

  return { type, title: title.trim(), date, time, uncertain };
}

export function validateItems(items, originalText, referenceDate) {
  const text = normalizeText(originalText);
  const fragments = items.map((item) => findFragment(text, item.originalFragment));

  return items.map((item, index) => {
    const fragment = fragments[index];
    const overlaps = fragment && fragments.some((other, otherIndex) =>
      other && otherIndex !== index &&
      fragment.start < other.end && other.start < fragment.end,
    );

    return validateWithFragment(item, text, overlaps ? null : fragment, referenceDate);
  });
}
