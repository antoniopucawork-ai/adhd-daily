import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import User from "../models/User.js";
import { updatePreferences } from "../controllers/preferencesController.js";
const router = express.Router();

// Rotte pubbliche
router.post("/register", register);
router.post("/login", login);

// Recuperiamo le informazioni dell'utente autenticato.
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

// Recuperiamo le preferenze dell'utente autenticato.
router.get("/preferences", verifyToken, async (req, res) => {
  try {
    // Cerchiamo l'utente utilizzando l'ID recuperato dal token.
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        message: "Utente non autorizzato",
      });
    }

    // Restituiamo soltanto le preferenze.
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

export default router;
// Salviamo le preferenze dell'utente autenticato.
router.patch("/preferences", verifyToken, updatePreferences);
