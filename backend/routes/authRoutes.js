import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import User from "../models/User.js";

const router = express.Router();

// Rotte pubbliche
router.post("/register", register);
router.post("/login", login);

// Rotta protetta: informazioni dell'utente autenticato
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

export default router;
