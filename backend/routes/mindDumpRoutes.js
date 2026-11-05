import express from "express";
import { analyzeRateLimit } from "../middleware/rateLimits.js";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  createMindDump,
  getMindDumps,
  analyzeMindDump,
} from "../controllers/mindDumpController.js";

import {
  getMindDumpById,
  updateMindDumpItem,
  deleteMindDumpItem,
  deleteMindDump,
  deleteAllMindDumps,
} from "../controllers/mindDumpCrudController.js";

const router = express.Router();

// Analizziamo il testo senza salvarlo.
router.post("/analyze", verifyToken, analyzeRateLimit, analyzeMindDump);

// Creiamo e recuperiamo i Mind Dump dell'utente.
router.post("/", verifyToken, createMindDump);
router.get("/", verifyToken, getMindDumps);

// Recuperiamo un singolo Mind Dump.
router.get("/:dumpId", verifyToken, getMindDumpById);

// Modifichiamo un elemento già salvato.
router.patch("/:dumpId/items/:itemId", verifyToken, updateMindDumpItem);

// Eliminiamo un singolo elemento.
router.delete("/:dumpId/items/:itemId", verifyToken, deleteMindDumpItem);

// Eliminiamo un intero Mind Dump.
router.delete("/:dumpId", verifyToken, deleteMindDump);

// Eliminiamo tutti i Mind Dump dell'utente.
router.delete("/", verifyToken, deleteAllMindDumps);

export default router;
