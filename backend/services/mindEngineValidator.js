import {
  MONTH_NAMES,
  findTemporalReferences,
  normalizeText,
  resolveTemporalExpression,
} from "./dateValidation.js";

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
  return [
    ...text.matchAll(new RegExp(`(?<!${WORD})${literal}(?!${WORD})`, "g")),
  ];
}

function findFragment(text, value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Elemento del Mind Engine senza evidenza nel testo");
  }
  const fragment = normalizeText(value);
  const [match, duplicate] = findLiteralMatches(text, fragment);
  if (!match) {
    throw new Error("Elemento del Mind Engine senza evidenza nel testo");
  }
  if (duplicate) return null;

  return { start: match.index, end: match.index + fragment.length };
}

// Il dubbio resta locale: non cerchiamo "forse" nell'intero Mind Dump.
function hasLocalForse(text, fragment, fragments) {
  if (/\bforse\b/.test(text.slice(fragment.start, fragment.end))) return true;

  // Gemini può aver omesso il qualificatore immediatamente precedente.
  const prefix = text.slice(0, fragment.start).match(/\bforse[\s,:]*$/);
  return Boolean(prefix) && !fragments.some(
    (other) => other.start <= prefix.index && prefix.index < other.end,
  );
}

function isWithin(fragment, start, end) {
  return fragment && fragment.start <= start && end <= fragment.end;
}

// Una correzione sostituisce il riferimento precedente solo se introduce
// direttamente una nuova data. "Anzi forse" resta da verificare.
function correctionLink(previous, next, text) {
  const between = text.slice(previous.end, next.start);
  if (/[.;!?]/.test(between.replace(/\d[.:]\d/g, ""))) return null;
  const correction = between.match(/\banzi\b([\s\S]*)$/);
  if (!correction) return null;
  return /^[\s,:]*(?:(?:il|del)\s+)?$/.test(correction[1])
    ? "confirmed"
    : "uncertain";
}

function isCorrectionSupported(reference, references, text, fragment) {
  const index = references.indexOf(reference);
  const previous = references[index - 1];
  const next = references[index + 1];
  if (next && correctionLink(reference, next, text)) return false;
  const alternativeLink = (left, right) =>
    /\b(?:o|oppure)\s+(?:(?:il|del)\s+)?$/.test(
      text.slice(left.end, right.start),
    );
  if (
    (next && alternativeLink(reference, next)) ||
    (previous && alternativeLink(previous, reference))
  )
    return false;
  if (previous) {
    const link = correctionLink(previous, reference, text);
    if (
      link &&
      (link !== "confirmed" ||
        !isWithin(fragment, reference.start, reference.end))
    ) {
      return false;
    }
  }
  return true;
}

// Recupera anche il contesto che Gemini può aver escluso dalla citazione,
// senza prendere il testo dei frammenti degli altri elementi.
function getYearContext(text, fragment, fragments) {
  let start = 0;
  let end = text.length;
  for (const match of text.matchAll(/[;!?]|\.(?!\d)/g)) {
    if (match.index < fragment.start) start = match.index + 1;
    if (match.index >= fragment.end) {
      end = match.index;
      break;
    }
  }
  for (const other of fragments) {
    if (other.end <= fragment.start) start = Math.max(start, other.end);
    if (other.start >= fragment.end) end = Math.min(end, other.start);
  }
  return text.slice(start, end);
}

// Indizi limitati e leggibili: non è un analizzatore grammaticale generale.
// Il passato prevale sugli indizi di appuntamento (es. "sono stato dal dentista").
function getYearDirection(context) {
  const past =
    /\b(?:ieri|scors[oaie]|passat[oaie]|ricordavo|andai|feci|ebbi|ero|eri|era|eravamo|eravate|erano|avevo|avevi|aveva|avevamo|avevate|avevano|andavo|andavi|andava)\b|\b(?:sono|sei|e|siamo|siete)\s+(?:gia\s+)?(?:stat[oaie]|andat[oaie]|tornat[oaie])\b|\b(?:ho|hai|ha|abbiamo|avete|hanno)\s+(?:gia\s+)?(?:fatto|fatta|avuto|avuta|visto|vista|incontrato|incontrata)\b/;
  if (past.test(context)) return "past";
  // Una negazione dell'impegno non autorizza una data futura; una frase
  // come "non ricordo l'orario" non deve invece cancellare la data.
  if (
    /\bnon\s+(?:ho|hai|ha|abbiamo|avete|hanno|devo|devi|deve|dobbiamo|dovete|devono|vado|vai|va|andiamo|andate|vanno)\b/.test(
      context,
    )
  )
    return "unknown";
  const futureAction =
    /\b(?:devo|devi|deve|dobbiamo|dovete|devono|vado|vai|va|andiamo|andate|vanno|andro|andremo|faro|faremo|avro|avremo|saro|saremo|dovro|dovremo)\b/;
  const appointment =
    /\b(?:ho|hai|ha|abbiamo|avete|hanno)\s+(?:(?:un|uno|una|il|lo|la)\s+|l['’])?(?:dentista|visita|appuntamento|controllo|riunione|esame)\b/;
  const agendaEntry =
    /^(?:dentista|visita|appuntamento|controllo|riunione|esame)\b/;
  return futureAction.test(context) ||
    appointment.test(context) ||
    agendaEntry.test(context.trim())
    ? "future"
    : "unknown";
}

function isDateSupported(
  date,
  expression,
  text,
  fragment,
  referenceDate,
  references,
  fragments,
) {
  if (!fragment || date === null || typeof expression !== "string")
    return false;

  const term = normalizeText(expression);
  if (!term) return false;
  const direction = getYearDirection(getYearContext(text, fragment, fragments));
  const allowNextYear = direction === "future";

  const matches = findLiteralMatches(text, term).filter((match) =>
    isWithin(fragment, match.index, match.index + term.length),
  );
  if (matches.length !== 1) return false;

  // Espandiamo la sola data adiacente alla citazione, non tutta la frase.
  // Così "domani, venerdì 13 novembre" viene verificato come un unico vincolo.
  const start = matches[0].index;
  const end = start + term.length;
  const related = references.filter(
    (reference) => reference.start < end && start < reference.end,
  );
  if (
    related.length > 1 &&
    !related
      .slice(1)
      .every(
        (next, index) =>
          correctionLink(related[index], next, text) === "confirmed",
      )
  )
    return false;
  const reference = related.at(-1);
  // Il contesto può completare una citazione, ma non cancellarne qualificatori
  // come "prossimo" o altre parole che il risolutore considera ambigue.
  if (
    reference &&
    related.length === 1 &&
    (start < reference.start || end > reference.end)
  ) {
    const quoted = resolveTemporalExpression(
      term,
      referenceDate,
      allowNextYear,
    );
    if (quoted.status !== "resolved" || quoted.date !== date) return false;
  }
  if (reference && !isWithin(fragment, reference.start, reference.end))
    return false;
  const dateExpression = reference?.expression ?? term;
  const needsYearContext =
    new RegExp(`\\d{1,2}\\s+(?:${MONTH_NAMES})\\b`).test(dateExpression) &&
    !/\b\d{4}\b|\b(?:ieri|oggi|domani|dopodomani)\b/.test(dateExpression);
  // Il passato non autorizza un anno dedotto. Con contesto sconosciuto,
  // il risolutore accetta l'anno corrente ma non il cambio d'anno.
  if (needsYearContext && direction === "past") return false;
  const resolution = resolveTemporalExpression(
    dateExpression,
    referenceDate,
    allowNextYear,
  );
  if (resolution.status !== "resolved" || date !== resolution.date)
    return false;
  if (
    reference &&
    !isCorrectionSupported(reference, references, text, fragment)
  )
    return false;

  const before = text.slice(0, start);
  const after = text.slice(start + term.length);

  // Controlla anche il testo vicino alla citazione, nel caso in cui Gemini l’abbia troncata.
  if (/\d[/-]$/.test(before) || /^[/-]\d/.test(after)) {
    return false;
  }

  const bareWeekday = new RegExp(`^${WEEKDAY}$`).test(term);
  if (
    bareWeekday &&
    (new RegExp(`\\b${QUALIFIER}\\s+$`).test(before) ||
      new RegExp(`^\\s+${QUALIFIER}\\b`).test(after))
  ) {
    return false;
  }

  // Una data testuale può condividere mese e anno con l'altro giorno.
  const sharedMonth = new RegExp(`^(?:(?:il|del)\\s+)?${TEXTUAL_DATE}$`).test(
    term,
  );
  const alternatives = sharedMonth
    ? `${DATE_ALTERNATIVE}|\\d{1,2}`
    : DATE_ALTERNATIVE;
  const alternativeDate = `(?:(?:il|del)\\s+)?(?:${alternatives})\\b(?![.:/-]\\d)`;

  return (
    !new RegExp(
      `\\b${alternativeDate}\\s+${ALTERNATIVE}\\s+(?:(?:il|del)\\s+)?$`,
    ).test(before) &&
    !new RegExp(`^\\s+${ALTERNATIVE}\\s+${alternativeDate}`).test(after)
  );
}

function isTimeSupported(time, text, fragment, fragments) {
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

  // Una citazione troncata non deve nascondere una correzione dell'orario.
  // Ci fermiamo prima del frammento di qualsiasi altro elemento.
  let continuationEnd = text.length;
  for (const other of fragments) {
    if (other.start >= fragment.end) {
      continuationEnd = Math.min(continuationEnd, other.start);
    }
  }
  // Il frammento può finire dentro "Anzi, alle": includiamo il prefisso
  // già citato, senza usare l'orario esterno come evidenza positiva.
  const unfinishedCorrection = text.slice(fragment.start, fragment.end).match(
    /\banzi\b[\s,:]*(?:forse\b[\s,]*)?(?:(?:alle(?: ore)?|ore)\s*)?$/,
  );
  const continuationStart = unfinishedCorrection
    ? fragment.start + unfinishedCorrection.index
    : fragment.end;
  const continuation = text.slice(continuationStart, continuationEnd);
  const [nextTime] = continuation.matchAll(clockPattern);
  if (
    nextTime &&
    (
      /^[\s,]*anzi[\s,]+forse\s+$/.test(continuation.slice(0, nextTime.index)) ||
      /^[\s,]*(?:\.\s*)?anzi[\s,:]*$/.test(continuation.slice(0, nextTime.index))
    )
  ) return false;

  let uncertainSentenceCorrection = false;
  const effectiveMatches = matches.filter((match, index) => {
    const next = matches[index + 1];

    if (!next) return true;

    const previousTime = {
      end: match.index + match[0].length,
    };

    const nextTime = {
      start: next.index,
    };

    // La correzione dell'orario può includere prima la nuova data.
    const between = text.slice(previousTime.end, nextTime.start);
    const date = findTemporalReferences(between).at(-1);
    if (date && /^\s*$/.test(between.slice(date.end))) {
      nextTime.start = previousTime.end + date.start;
    }

    // Solo per gli orari, "Anzi" può correggere la frase appena conclusa.
    // Non attraversiamo altre frasi o descrizioni dopo il punto.
    const sentenceCorrection = /^[^.;!?]*\.\s*anzi[\s,:]*$/.test(between);
    // Confermiamo solo una rettifica composta dal solo orario. Qualsiasi
    // dubbio o descrizione aggiuntiva richiede una verifica dell'utente.
    if (
      sentenceCorrection &&
      !/^\s*\.?\s*$/.test(
        text.slice(next.index + next[0].length, continuationEnd),
      )
    ) uncertainSentenceCorrection = true;
    return !sentenceCorrection &&
      correctionLink(previousTime, nextTime, text) !== "confirmed";
  });

  if (uncertainSentenceCorrection) return false;

  const times = new Set(
    effectiveMatches.map(([, hour, minutes, bareHour, bareMinutes, period]) => {
      let supportedHour = Number(hour ?? bareHour);
      if (period === "mattina") {
        // Le dodici di mattina non distinguono con sicurezza mezzogiorno e mezzanotte.
        if (supportedHour >= 12) return null;
      } else if (period) {
        if (supportedHour === 0 || (supportedHour === 12 && period === "sera"))
          return null;
        if (supportedHour < 12) supportedHour += 12;
      }
      return `${String(supportedHour).padStart(2, "0")}:${minutes ?? bareMinutes ?? "00"}`;
    }),
  );
  if (times.has(null) || times.size !== 1 || !times.has(time)) return false;

  const qualifiedClock = `${CLOCK}(?:\\s+di\\s+${periodPattern}\\b)?`;
  const alternativeBefore = new RegExp(
    `\\b${qualifiedClock}\\s+${ALTERNATIVE}\\s+$`,
  );
  const alternativeAfter = new RegExp(
    `^\\s+${ALTERNATIVE}\\s+(?:(?:alle(?: ore)?|ore)\\s+)?${CLOCK}\\b`,
  );
  const alternativePeriodAfter = new RegExp(
    `^\\s+${ALTERNATIVE}\\s+(?:di\\s+)?${periodPattern}\\b`,
  );

  return effectiveMatches.every(
    (match) =>
      !alternativeBefore.test(text.slice(0, match.index)) &&
      !alternativeAfter.test(text.slice(match.index + match[0].length)) &&
      !(
        match[5] &&
        alternativePeriodAfter.test(text.slice(match.index + match[0].length))
      ),
  );
}

function validateWithFragment(
  item,
  text,
  fragment,
  referenceDate,
  references,
  fragments,
) {
  const { type, title, temporalExpression } = item;
  let { date, time, uncertain } = item;

  // Citazioni ripetute o sovrapposte non confermano un singolo elemento.
  if (!fragment || hasLocalForse(text, fragment, fragments)) uncertain = true;

  if (
    (date !== null || temporalExpression !== null) &&
    !isDateSupported(
      date,
      temporalExpression,
      text,
      fragment,
      referenceDate,
      references,
      fragments,
    )
  ) {
    date = null;
    uncertain = true;
  }

  if (time !== null && !isTimeSupported(time, text, fragment, fragments)) {
    time = null;
    uncertain = true;
  }

  return { type, title: title.trim(), date, time, uncertain };
}

export function validateItems(items, originalText, referenceDate) {
  const text = normalizeText(originalText);
  const fragments = items.map((item) =>
    findFragment(text, item.originalFragment),
  );

  const references = findTemporalReferences(text, fragments.filter(Boolean));

  return items.map((item, index) => {
    const fragment = fragments[index];
    const overlaps =
      fragment &&
      fragments.some(
        (other, otherIndex) =>
          other &&
          otherIndex !== index &&
          fragment.start < other.end &&
          other.start < fragment.end,
      );

    return validateWithFragment(
      item,
      text,
      overlaps ? null : fragment,
      referenceDate,
      references,
      fragments.filter(Boolean),
    );
  });
}
