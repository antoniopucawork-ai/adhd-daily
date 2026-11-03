import MindDump from "../models/MindDump.js";
import { analyzeThought } from "../services/mindEngineService.js";
import { isValidDate } from "../services/dateValidation.js";

// Limiti del Mind Dump
const MAX_TEXT_LENGTH = 10000;
const MAX_ITEMS = 20;
const MAX_TITLE_LENGTH = 200;

// Categorie riconosciute dal sistema
const ALLOWED_TYPES = ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"];

// Verifica il testo originale.
function isValidOriginalText(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_TEXT_LENGTH
  );
}

// Verifica una data.
// Il valore può essere assente oppure una data reale.
function isValidItemDate(value) {
  return value == null || isValidDate(value);
}

// Verifica un orario nel formato HH:mm.
function isValidItemTime(value) {
  return (
    value == null ||
    (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  );
}

// Controlla ogni elemento prima del salvataggio.
function isValidItem(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    ALLOWED_TYPES.includes(item.type) &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    item.title.length <= MAX_TITLE_LENGTH &&
    isValidItemDate(item.date) &&
    isValidItemTime(item.time) &&
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
        message: "Inserisci un pensiero valido (massimo 10000 caratteri)",
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

export const analyzeMindDump = async (req, res) => {
  try {
    const { originalText } = req.body ?? {};

    // La validazione è la stessa della creazione.
    if (!isValidOriginalText(originalText)) {
      return res.status(400).json({
        message: "Inserisci un pensiero valido (massimo 10000 caratteri)",
      });
    }

    // Gemini interpreta il testo.
    // Questa operazione non salva nulla in MongoDB.
    const result = await analyzeThought(originalText.trim());

    return res.status(200).json(result);
  } catch (error) {
    console.error("Errore analisi Mind Dump:", error.message);

    return res.status(502).json({
      message: "Non è stato possibile analizzare il pensiero. Riprova.",
    });
  }
};
