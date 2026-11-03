import mongoose from "mongoose";
import MindDump from "../models/MindDump.js";
import { isValidDate } from "../services/dateValidation.js";

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

// Verifica che l'ID sia un ObjectId MongoDB valido.
function isValidId(value) {
  return (
    typeof value === "string" &&
    /^[a-fA-F0-9]{24}$/.test(value) &&
    mongoose.isValidObjectId(value)
  );
}

// Una data può essere null oppure una data reale.
function isValidItemDate(value) {
  return value === null || isValidDate(value);
}

// Un orario può essere null oppure HH:mm.
function isValidTime(value) {
  return (
    value === null ||
    (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  );
}

// Controlla i campi ricevuti per la modifica.
function isValidUpdate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  const fields = Object.keys(body);

  // Non accettiamo modifiche vuote
  // né campi non previsti.
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
        return isValidItemDate(value);

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

// Gestisce gli errori di validazione Mongoose.
function isDatabaseValidationError(error) {
  return (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  );
}

// ==========================================
// RECUPERA UN SINGOLO MIND DUMP
// ==========================================

export async function getMindDumpById(req, res) {
  try {
    const { dumpId } = req.params;

    if (!isValidId(dumpId)) {
      return res.status(400).json({
        message: "ID non valido",
      });
    }

    // Il documento deve appartenere
    // all'utente autenticato.
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

// ==========================================
// MODIFICA UN ELEMENTO
// ==========================================

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

    // Prepariamo soltanto i campi autorizzati.
    // Il simbolo $ identifica l'elemento
    // corrispondente alla query.
    const updates = {};

    for (const [field, value] of Object.entries(req.body)) {
      updates[`items.$.${field}`] = field === "title" ? value.trim() : value;
    }

    // Aggiornamento mirato, senza leggere e
    // risalvare l'intero Mind Dump.
    const mindDump = await MindDump.findOneAndUpdate(
      {
        _id: dumpId,
        user: req.userId,
        "items._id": new mongoose.Types.ObjectId(itemId),
      },
      {
        $set: updates,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!mindDump) {
      return res.status(404).json({
        message: "Elemento non trovato",
      });
    }

    const updatedItem = mindDump.items.id(itemId);

    return res.status(200).json({
      message: "Elemento aggiornato correttamente",
      item: updatedItem,
    });
  } catch (error) {
    if (isDatabaseValidationError(error)) {
      return res.status(400).json({
        message: "Dati della modifica non validi",
      });
    }

    console.error("Errore modifica elemento:", error.message);

    return res.status(500).json({
      message: "Errore durante la modifica dell'elemento",
    });
  }
}

// ==========================================
// ELIMINA UN SINGOLO ELEMENTO
// ==========================================

export async function deleteMindDumpItem(req, res) {
  try {
    const { dumpId, itemId } = req.params;

    if (!isValidId(dumpId) || !isValidId(itemId)) {
      return res.status(400).json({
        message: "ID non valido",
      });
    }

    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    // Aggiornamento atomico sul documento.
    //
    // Prima rimuoviamo l'elemento selezionato.
    // Poi ricalcoliamo lo stato in base
    // all'array aggiornato.
    //
    // originalText non viene mai modificato.
    const mindDump = await MindDump.findOneAndUpdate(
      {
        _id: dumpId,
        user: req.userId,
        "items._id": itemObjectId,
      },
      [
        {
          $set: {
            items: {
              $filter: {
                input: "$items",
                as: "item",
                cond: {
                  $ne: ["$$item._id", itemObjectId],
                },
              },
            },
          },
        },
        {
          $set: {
            status: {
              $cond: [
                {
                  $eq: [{ $size: "$items" }, 0],
                },
                "saved",
                "organized",
              ],
            },
          },
        },
      ],
      {
        updatePipeline: true,
        returnDocument: "after",
      },
    );

    if (!mindDump) {
      return res.status(404).json({
        message: "Elemento non trovato",
      });
    }

    return res.status(200).json({
      message: "Elemento eliminato correttamente",

      // Il documento originale viene conservato.
      removedDump: false,

      // Numero di elementi rimasti.
      remainingItems: mindDump.items.length,
    });
  } catch (error) {
    console.error("Errore eliminazione elemento:", error.message);

    return res.status(500).json({
      message: "Errore durante l'eliminazione dell'elemento",
    });
  }
}

// ==========================================
// ELIMINA UN MIND DUMP COMPLETO
// ==========================================

export async function deleteMindDump(req, res) {
  try {
    const { dumpId } = req.params;

    if (!isValidId(dumpId)) {
      return res.status(400).json({
        message: "ID non valido",
      });
    }

    // Operazione distinta dall'eliminazione
    // di un singolo elemento.
    //
    // Cancella intenzionalmente anche
    // originalText e tutti gli elementi.
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

// ==========================================
// ELIMINA TUTTI I MIND DUMP
// ==========================================

export async function deleteAllMindDumps(req, res) {
  try {
    // Richiede una conferma esplicita.
    if (req.body?.confirmation !== "ELIMINA TUTTO") {
      return res.status(400).json({
        message: "Conferma di eliminazione mancante",
      });
    }

    // Il filtro per utente è obbligatorio.
    // Non cancelliamo documenti di altri account.
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
