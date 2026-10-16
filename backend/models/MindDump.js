import mongoose from "mongoose";

// 1. DEFINIZIONE DEL MODELLO MIND DUMP

const mindDumpSchema = new mongoose.Schema(
  {
    // Utente proprietario del pensiero
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Testo originale scritto dall'utente
    originalText: {
      type: String,
      required: true,
      maxlength: 10000,
    },

    // Stato del pensiero
    status: {
      type: String,
      enum: ["saved", "organized"],
      default: "saved",
    },
  },

  // Date automatiche di creazione e modifica
  {
    timestamps: true,
  },
);

const MindDump = mongoose.model("MindDump", mindDumpSchema);

export default MindDump;
