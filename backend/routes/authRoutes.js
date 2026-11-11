import express from "express";

import { register, login, googleLogin } from "../controllers/authController.js";

import {
  verifyAccount,
  resendVerification,
} from "../controllers/emailVerificationController.js";

import {
  loginRateLimit,
  registerRateLimit,
  resendVerificationRateLimit,
} from "../middleware/rateLimits.js";

import { verifyToken } from "../middleware/verifyToken.js";
import { updatePreferences } from "../controllers/preferencesController.js";
import User from "../models/User.js";

const router = express.Router();

// REGISTRAZIONE E ACCESSO

router.post("/register", registerRateLimit, register);

router.post("/login", loginRateLimit, login);

router.post("/google", loginRateLimit, googleLogin);

// VERIFICA EMAIL

// Attiviamo l'account tramite il token ricevuto
router.post("/verify-account", verifyAccount);

// Permettiamo di richiedere una nuova email di verifica
router.post(
  "/resend-verification",
  resendVerificationRateLimit,
  resendVerification,
);

// PROFILO UTENTE

// Recuperiamo i dati dell'utente autenticato
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        message: "Utente non autorizzato",
      });
    }

    return res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore durante il recupero del profilo",
    });
  }
});

// PREFERENZE UTENTE

// Recuperiamo le preferenze salvate nel database
router.get("/preferences", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        message: "Utente non autorizzato",
      });
    }

    return res.status(200).json({
      onboardingCompleted: user.preferences?.onboardingCompleted ?? false,
      homeModules: user.preferences?.homeModules ?? [],
    });
  } catch (error) {
    console.error("Errore nel recupero delle preferenze:", error);

    return res.status(500).json({
      message: "Errore durante il recupero delle preferenze",
    });
  }
});

// Salviamo le preferenze dell'utente
router.patch("/preferences", verifyToken, updatePreferences);

export default router;
