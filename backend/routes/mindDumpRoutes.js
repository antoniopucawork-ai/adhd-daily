import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createMindDump } from "../controllers/mindDumpController.js";

const router = express.Router();

router.post("/", verifyToken, createMindDump);

export default router;
