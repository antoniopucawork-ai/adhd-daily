import MindDump from "../models/MindDump.js";
import { analyzeThought } from "../services/mindEngineService.js";
import {
  ITEM_TYPES,
  MAX_ITEMS,
  MAX_TEXT_LENGTH,
  isNullableDate,
  isNullableTime,
  isValidOriginalText,
  isValidTitle,
} from "../services/mindDumpRules.js";

// Controlla ogni elemento prima del salvataggio.
function isValidItem(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    ITEM_TYPES.includes(item.type) &&
    isValidTitle(item.title) &&
    isNullableDate(item.date ?? null) &&
    isNullableTime(item.time ?? null) &&
    (item.uncertain == null || typeof item.uncertain === "boolean")
  );
}

// Conserva soltanto i campi consentiti.
function sanitizeItem(item) {
  return {
    type: item.type,
    title: item.title.trim(),
    date: item.date ?? null,
    time: item.time ?? null,
    uncertain: item.uncertain ?? false,
  };
}

// ==========================================
// CREA UN MIND DUMP
// POST /api/mind-dumps
// ==========================================

export const createMindDump = async (req, res) => {
  try {
    const { originalText, items = [] } = req.body ?? {};

    // Controllo del testo originale
    if (!isValidOriginalText(originalText)) {
      return res.status(400).json({
        message: `Inserisci un pensiero valido (massimo ${MAX_TEXT_LENGTH} caratteri)`,
      });
    }

    // Controllo del numero di elementi
    if (!Array.isArray(items) || items.length > MAX_ITEMS) {
      return res.status(400).json({
        message: "Gli elementi del pensiero non sono validi",
      });
    }

    // Controllo della struttura degli elementi
    if (!items.every(isValidItem)) {
      return res.status(400).json({
        message: "Uno degli elementi contiene dati non validi",
      });
    }

    // Prepariamo soltanto i dati validati.
    const cleanItems = items.map(sanitizeItem);

    // Il proprietario viene dal JWT verificato.
    const mindDump = await MindDump.create({
      user: req.userId,
      originalText: originalText.trim(),
      status: cleanItems.length > 0 ? "organized" : "saved",
      items: cleanItems,
    });

    return res.status(201).json({
      message: "Pensiero salvato correttamente",
      mindDump,
    });
  } catch (error) {
    console.error("Errore salvataggio Mind Dump:", error.message);

    return res.status(500).json({
      message: "Errore durante il salvataggio del pensiero",
    });
  }
};

// ==========================================
// RECUPERA I MIND DUMP DELL'UTENTE
// GET /api/mind-dumps
// ==========================================

export const getMindDumps = async (req, res) => {
  try {
    // Recuperiamo soltanto i documenti dell'utente.
    // I più recenti vengono mostrati per primi.
    const mindDumps = await MindDump.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(mindDumps);
  } catch (error) {
    console.error("Errore recupero Mind Dump:", error.message);

    return res.status(500).json({
      message: "Errore durante il recupero dei pensieri",
    });
  }
};

// ==========================================
// ANALIZZA UN PENSIERO CON GEMINI
// POST /api/mind-dumps/analyze
// ==========================================

const ANALYSIS_TIMEOUT_MS = 15_000;

export const analyzeMindDump = async (req, res) => {
  const { originalText } = req.body ?? {};

  if (!isValidOriginalText(originalText)) {
    return res.status(400).json({
      message: `Inserisci un pensiero valido (massimo ${MAX_TEXT_LENGTH} caratteri)`,
    });
  }

  const signal = AbortSignal.timeout(ANALYSIS_TIMEOUT_MS);
  try {
    // Gemini interpreta il testo senza salvare nulla in MongoDB.
    const result = await analyzeThought(originalText.trim(), { signal });
    signal.throwIfAborted();

    return res.status(200).json(result);
  } catch {
    if (signal.aborted) {
      return res.status(504).json({
        message: "L’analisi ha impiegato troppo tempo. Riprova.",
      });
    }

    console.warn("Analisi Mind Dump non riuscita.");
    return res.status(502).json({
      message: "Non è stato possibile analizzare il pensiero. Riprova.",
    });
  }
};
