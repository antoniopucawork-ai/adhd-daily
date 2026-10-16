import MindDump from "../models/MindDump.js";

export const createMindDump = async (req, res) => {
  try {
    // 2. RECUPERO DEI DATI

    const { originalText } = req.body ?? {};

    // 3. VALIDAZIONE DEL TESTO  CHE TROVIAMO

    if (
      typeof originalText !== "string" ||
      !originalText.trim() ||
      originalText.length > 10000
    ) {
      return res.status(400).json({
        message: "Inserisci un pensiero valido (massimo 10000 caratteri)",
      });
    }

    const mindDump = await MindDump.create({
      user: req.userId,
      originalText: originalText,
    });

    return res.status(201).json({
      message: "Pensiero salvato correttamente",
      mindDump: mindDump,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore durante il salvataggio del pensiero",
    });
  }
};
