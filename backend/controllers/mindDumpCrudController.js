import mongoose from "mongoose";
import MindDump from "../models/MindDump.js";

const ALLOWED_TYPES = ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"];

const ALLOWED_STATUS = ["TODO", "DONE"];

const EDITABLE_FIELDS = [
  "type",
  "title",
  "date",
  "time",
  "uncertain",
  "status",
];

// Controlliamo gli ID prima di usarli nelle query.
function isValidId(value) {
  return (
    typeof value === "string" &&
    /^[a-fA-F0-9]{24}$/.test(value) &&
    mongoose.isValidObjectId(value)
  );
}

// Controlliamo anche che la data esista davvero.
function isValidDate(value) {
  if (value === null) return true;

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isValidTime(value) {
  return (
    value === null ||
    (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  );
}

// Validiamo solo i campi che l'utente può modificare.
function isValidUpdate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  const fields = Object.keys(body);

  if (
    fields.length === 0 ||
    fields.some((field) => !EDITABLE_FIELDS.includes(field))
  ) {
    return false;
  }

  return fields.every((field) => {
    const value = body[field];

    switch (field) {
      case "type":
        return ALLOWED_TYPES.includes(value);

      case "title":
        return (
          typeof value === "string" &&
          value.trim().length > 0 &&
          value.length <= 200
        );

      case "date":
        return isValidDate(value);

      case "time":
        return isValidTime(value);

      case "uncertain":
        return typeof value === "boolean";

      case "status":
        return ALLOWED_STATUS.includes(value);

      default:
        return false;
    }
  });
}

// Recuperiamo un singolo Mind Dump dell'utente.
export async function getMindDumpById(req, res) {
  try {
    const { dumpId } = req.params;

    if (!isValidId(dumpId)) {
      return res.status(400).json({
        message: "ID non valido",
      });
    }

    const mindDump = await MindDump.findOne({
      _id: dumpId,
      user: req.userId,
    });

    if (!mindDump) {
      return res.status(404).json({
        message: "Pensiero non trovato",
      });
    }

    return res.status(200).json(mindDump);
  } catch (error) {
    console.error("Errore recupero Mind Dump:", error.message);

    return res.status(500).json({
      message: "Errore durante il recupero del pensiero",
    });
  }
}

// Modifichiamo un elemento già salvato in MongoDB.
export async function updateMindDumpItem(req, res) {
  try {
    const { dumpId, itemId } = req.params;

    if (!isValidId(dumpId) || !isValidId(itemId)) {
      return res.status(400).json({
        message: "ID non valido",
      });
    }

    if (!isValidUpdate(req.body)) {
      return res.status(400).json({
        message: "Dati della modifica non validi",
      });
    }

    // Cerchiamo soltanto nei documenti dell'utente autenticato.
    const mindDump = await MindDump.findOne({
      _id: dumpId,
      user: req.userId,
    });

    if (!mindDump) {
      return res.status(404).json({
        message: "Pensiero non trovato",
      });
    }

    const item = mindDump.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Elemento non trovato",
      });
    }

    // Non permettiamo di modificare ID, utente o testo originale.
    for (const field of Object.keys(req.body)) {
      item[field] =
        field === "title" ? req.body[field].trim() : req.body[field];
    }

    await mindDump.save();

    return res.status(200).json({
      message: "Elemento aggiornato correttamente",
      item: mindDump.items.id(itemId),
    });
  } catch (error) {
    console.error("Errore modifica elemento:", error.message);

    return res.status(500).json({
      message: "Errore durante la modifica dell'elemento",
    });
  }
}

// Eliminiamo soltanto l'elemento selezionato.
export async function deleteMindDumpItem(req, res) {
  try {
    const { dumpId, itemId } = req.params;

    if (!isValidId(dumpId) || !isValidId(itemId)) {
      return res.status(400).json({
        message: "ID non valido",
      });
    }

    const mindDump = await MindDump.findOneAndUpdate(
      {
        _id: dumpId,
        user: req.userId,
        "items._id": itemId,
      },
      {
        $pull: {
          items: { _id: itemId },
        },
      },
      {
        new: true,
      },
    );

    if (!mindDump) {
      return res.status(404).json({
        message: "Elemento non trovato",
      });
    }

    let removedDump = false;

    // Se non rimangono elementi, eliminiamo anche il documento vuoto.
    if (mindDump.items.length === 0) {
      const result = await MindDump.deleteOne({
        _id: dumpId,
        user: req.userId,
        items: { $size: 0 },
      });

      removedDump = result.deletedCount === 1;
    }

    return res.status(200).json({
      message: "Elemento eliminato correttamente",
      removedDump,
    });
  } catch (error) {
    console.error("Errore eliminazione elemento:", error.message);

    return res.status(500).json({
      message: "Errore durante l'eliminazione dell'elemento",
    });
  }
}

// Eliminiamo il testo originale e tutti i suoi elementi.
export async function deleteMindDump(req, res) {
  try {
    const { dumpId } = req.params;

    if (!isValidId(dumpId)) {
      return res.status(400).json({
        message: "ID non valido",
      });
    }

    const mindDump = await MindDump.findOneAndDelete({
      _id: dumpId,
      user: req.userId,
    });

    if (!mindDump) {
      return res.status(404).json({
        message: "Pensiero non trovato",
      });
    }

    return res.status(200).json({
      message: "Mind Dump eliminato correttamente",
    });
  } catch (error) {
    console.error("Errore eliminazione Mind Dump:", error.message);

    return res.status(500).json({
      message: "Errore durante l'eliminazione del Mind Dump",
    });
  }
}

// Eliminiamo tutti i Mind Dump dell'utente.
// Richiediamo una conferma esplicita anche al backend.
export async function deleteAllMindDumps(req, res) {
  try {
    if (req.body?.confirmation !== "ELIMINA TUTTO") {
      return res.status(400).json({
        message: "Conferma di eliminazione mancante",
      });
    }

    const result = await MindDump.deleteMany({
      user: req.userId,
    });

    return res.status(200).json({
      message: "Tutti i pensieri sono stati eliminati",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Errore eliminazione totale:", error.message);

    return res.status(500).json({
      message: "Errore durante l'eliminazione dei pensieri",
    });
  }
}
