import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyGoogleUser } from "../services/googleAuthService.js";
// REGISTRAZIONE UTENTE

export const register = async (req, res) => {
  try {
    // 1. Recuperiamo i dati dalla richiesta
    const { firstName, email, password } = req.body ?? {};

    // 2. Controlliamo che i dati siano presenti
    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Nome, email e password sono obbligatori",
      });
    }

    // 3. Controlliamo il formato dell'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        message: "Controlla i dati inseriti e riprova",
      });
    }

    // 4. Controlliamo la lunghezza della password
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "La password non rispetta i requisiti di sicurezza",
      });
    }

    // 5. Normalizziamo l'email
    const normalizedEmail = email.trim().toLowerCase();

    // 6. Controlliamo se l'email è già registrata
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Impossibile completare la registrazione",
      });
    }

    // 7. Generiamo l'hash della password
    const passwordHash = await bcrypt.hash(password, 12);

    // 8. Creiamo l'utente nel database
    const newUser = await User.create({
      firstName: firstName.trim(),
      email: normalizedEmail,
      passwordHash: passwordHash,
    });

    // 9. Restituiamo i dati pubblici dell'utente
    return res.status(201).json({
      message: "Registrazione completata con successo",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        email: newUser.email,
      },
    });
  } catch (error) {
    // 10. Gestiamo le email duplicate
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Impossibile completare la registrazione",
      });
    }

    // 11. Gestiamo gli errori imprevisti
    return res.status(500).json({
      message: "Errore durante la registrazione",
    });
  }
};

// LOGIN UTENTE

export const login = async (req, res) => {
  try {
    // 1. Recuperiamo email e password
    const { email, password } = req.body ?? {};

    // 2. Controlliamo che i dati siano presenti
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email e password sono obbligatorie",
      });
    }

    // 3. Normalizziamo l'email
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Cerchiamo l'utente nel database
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    // 5. Controlliamo che l'utente esista
    // e che abbia una password per il login tradizionale
    if (!user || typeof user.passwordHash !== "string") {
      return res.status(401).json({
        message: "Email o password non corrette",
      });
    }

    // 6. Verifichiamo la password con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    // 7. Controlliamo se la password è corretta
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email o password non corrette",
      });
    }

    // 8. Generiamo il token JWT
    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    // 9. Restituiamo il token e i dati pubblici dell'utente
    return res.status(200).json({
      message: "Login effettuato con successo",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
      },
    });
  } catch (error) {
    // 10. Gestiamo gli errori imprevisti
    return res.status(500).json({
      message: "Errore durante il login",
    });
  }
};

 // LOGIN CON GOOGLE

export const googleLogin = async (req, res) => {
  // 1. Recuperiamo la credenziale Google
  const { credential } = req.body ?? {};

  if (typeof credential !== "string" || !credential.trim()) {
    return res.status(400).json({
      message: "Credenziale Google mancante",
    });
  }

  // 2. Verifichiamo la credenziale
  let googleUser;

  try {
    googleUser = await verifyGoogleUser(credential);
  } catch (error) {
    return res.status(401).json({
      message: "Accesso Google non valido",
    });
  }

  try {
    // 3. Cerchiamo un account collegato a Google
    let user = await User.findOne({
      googleId: googleUser.googleId,
    });

    // 4. Se non esiste, controlliamo l'email
    if (!user) {
      const existingUser = await User.findOne({
        email: googleUser.email,
      });

      // Non colleghiamo automaticamente account differenti
      if (existingUser) {
        return res.status(409).json({
          message: "Email già registrata. Accedi con email e password.",
        });
      }

      // 5. Creiamo un nuovo account Google
      user = await User.create({
        firstName: googleUser.firstName,
        email: googleUser.email,
        googleId: googleUser.googleId,
      });
    }

    // 6. Generiamo il nostro JWT
    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    // 7. Restituiamo la stessa struttura del login normale
    return res.status(200).json({
      message: "Login effettuato con successo",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Impossibile completare l'accesso Google",
      });
    }

    return res.status(500).json({
      message: "Errore durante il login Google",
    });
  }
};
