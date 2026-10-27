import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  createMindDump,
  getMindDumps,
  analyzeMindDump,
} from "../controllers/mindDumpController.js";

const router = express.Router();

// Analizza il pensiero con Gemini, senza salvarlo
router.post("/analyze", verifyToken, analyzeMindDump);

// Salva il pensiero nel database
router.post("/", verifyToken, createMindDump);

// Recupera i pensieri dell'utente
router.get("/", verifyToken, getMindDumps);

export default router;
