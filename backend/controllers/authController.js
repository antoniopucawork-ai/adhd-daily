import User from "../models/User.js";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
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

    // 9. Restituiamo la risposta senza la password
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

    // 5. Controlliamo se l'utente esiste
    if (!user) {
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

    // 8. Le credenziali sono corrette

    // Generiamo un token JWT per identificare l'utente
    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    // Restituiamo il token e i dati pubblici dell'utente
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
    // 9. Gestiamo gli errori imprevisti
    return res.status(500).json({
      message: "Errore durante il login",
    });
  }
};
