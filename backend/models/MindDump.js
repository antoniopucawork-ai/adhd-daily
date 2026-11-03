import mongoose from "mongoose";
import { isValidDate } from "../services/dateValidation.js";

const MAX_ITEMS = 20;

// Verifica la validità delle date.
// Una data assente deve essere rappresentata da null.
function isValidItemDate(value) {
  return value === null || isValidDate(value);
}

// Verifica il formato HH:mm.
// Anche l'orario può essere assente.
function isValidItemTime(value) {
  return (
    value === null ||
    (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  );
}

// Schema di un singolo elemento organizzato.
const mindDumpItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    date: {
      type: String,
      default: null,
      validate: {
        validator: isValidItemDate,
        message: "La data deve essere valida (YYYY-MM-DD)",
      },
    },

    time: {
      type: String,
      default: null,
      validate: {
        validator: isValidItemTime,
        message: "L'orario deve essere valido (HH:mm)",
      },
    },

    uncertain: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["TODO", "DONE"],
      default: "TODO",
    },
  },
  {
    _id: true,
  },
);

// Schema principale del Mind Dump.
const mindDumpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Conserviamo il testo scritto dall'utente.
    originalText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    status: {
      type: String,
      enum: ["saved", "organized"],
      default: "saved",
    },

    items: {
      type: [mindDumpItemSchema],
      default: [],
      validate: {
        validator: (items) => Array.isArray(items) && items.length <= MAX_ITEMS,
        message: `Un Mind Dump può contenere al massimo ${MAX_ITEMS} elementi`,
      },
    },
  },
  {
    timestamps: true,
  },
);

const MindDump = mongoose.model("MindDump", mindDumpSchema);

export default MindDump;
