import MindDump from "../models/MindDump.js";
import { analyzeThought } from "../services/mindEngineService.js";
export const createMindDump = async (req, res) => {
  try {
    const { originalText, items = [] } = req.body ?? {};

    if (
      typeof originalText !== "string" ||
      !originalText.trim() ||
      originalText.length > 10000
    ) {
      return res.status(400).json({
        message: "Inserisci un pensiero valido (massimo 10000 caratteri)",
      });
    }

    if (!Array.isArray(items) || items.length > 20) {
      return res.status(400).json({
        message: "Gli elementi del pensiero non sono validi",
      });
    }

    const allowedTypes = ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"];

    for (const item of items) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        !allowedTypes.includes(item.type) ||
        typeof item.title !== "string" ||
        !item.title.trim() ||
        item.title.length > 200 ||
        (item.date != null && typeof item.date !== "string") ||
        (item.time != null && typeof item.time !== "string") ||
        (item.uncertain != null && typeof item.uncertain !== "boolean")
      ) {
        return res.status(400).json({
          message: "Uno degli elementi contiene dati non validi",
        });
      }
    }

    const mindDump = await MindDump.create({
      user: req.userId,
      originalText: originalText.trim(),
      status: items.length > 0 ? "organized" : "saved",
      items: items.map((item) => ({
        type: item.type,
        title: item.title.trim(),
        date: item.date ?? null,
        time: item.time ?? null,
        uncertain: item.uncertain ?? false,
      })),
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
export const getMindDumps = async (req, res) => {
  try {
    const mindDumps = await MindDump.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(mindDumps);
  } catch (error) {
    console.error("Errore nel recupero dei Mind Dump:", error);

    return res.status(500).json({
      message: "Errore durante il recupero dei pensieri",
    });
  }
};
export const analyzeMindDump = async (req, res) => {
  try {
    const { originalText } = req.body ?? {};

    if (
      typeof originalText !== "string" ||
      !originalText.trim() ||
      originalText.length > 10000
    ) {
      return res.status(400).json({
        message: "Inserisci un pensiero valido (massimo 10000 caratteri)",
      });
    }

    const result = await analyzeThought(originalText.trim());

    return res.status(200).json(result);
  } catch (error) {
    console.error("Errore analisi Mind Dump:", error.message);

    return res.status(502).json({
      message: "Non è stato possibile analizzare il pensiero. Riprova.",
    });
  }
};
