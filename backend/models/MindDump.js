import mongoose from "mongoose";
import {
  ITEM_STATUSES,
  ITEM_TYPES,
  MAX_ITEMS,
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  isNullableDate,
  isNullableTime,
} from "../services/mindDumpRules.js";

// Schema di un singolo elemento organizzato.
const mindDumpItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ITEM_TYPES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_TITLE_LENGTH,
    },

    date: {
      type: String,
      default: null,
      validate: {
        validator: isNullableDate,
        message: "La data deve essere valida (YYYY-MM-DD)",
      },
    },

    time: {
      type: String,
      default: null,
      validate: {
        validator: isNullableTime,
        message: "L'orario deve essere valido (HH:mm)",
      },
    },

    uncertain: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ITEM_STATUSES,
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
      maxlength: MAX_TEXT_LENGTH,
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
