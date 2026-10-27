import mongoose from "mongoose";

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
    },

    time: {
      type: String,
      default: null,
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
  { _id: true },
);

const mindDumpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    originalText: {
      type: String,
      required: true,
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
    },
  },
  {
    timestamps: true,
  },
);

const MindDump = mongoose.model("MindDump", mindDumpSchema);

export default MindDump;
