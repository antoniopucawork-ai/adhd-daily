import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { verifyGoogleUser } from "../services/googleAuthService.js";
import { sendVerificationEmail } from "../services/emailService.js";

// REGISTRAZIONE UTENTE

export const register = async (req, res) => {
  try {
    // Recuperiamo i dati inseriti dall'utente
    const { firstName, email, password } = req.body ?? {};

    // Controlliamo che tutti i campi siano presenti
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

    // Controlliamo il formato dell'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        message: "Controlla i dati inseriti e riprova",
      });
    }

    // Controlliamo la lunghezza della password
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "La password non rispetta i requisiti di sicurezza",
      });
    }

    // Normalizziamo l'email
    const normalizedEmail = email.trim().toLowerCase();

    // Controlliamo se l'email è già registrata
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Impossibile completare la registrazione",
      });
    }

    // Proteggiamo la password con bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // Generiamo un token casuale per verificare l'email
    const verificationToken = randomBytes(32).toString("hex");

    // Salviamo soltanto l'hash del token
    const verificationTokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Il link di verifica scade dopo 5 minuti
    const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Creiamo l'account in attesa di verifica
    const newUser = await User.create({
      firstName: firstName.trim(),
      email: normalizedEmail,
      passwordHash: passwordHash,
      status: "PENDING",
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationExpiresAt: verificationExpiresAt,
      emailVerificationSentAt: new Date(),
    });

    // Proviamo a inviare l'email tramite Brevo
    let emailSent = true;

    try {
      await sendVerificationEmail(newUser.email, verificationToken);
    } catch (error) {
      emailSent = false;
    }

    // Comunichiamo il risultato della registrazione
    return res.status(201).json({
      message: emailSent
        ? "Account creato. Controlla la tua email per attivarlo."
        : "Account creato, ma email non inviata. Riprova tra un minuto.",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        email: newUser.email,
      },
    });
  } catch (error) {
    // Gestiamo le email già registrate
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Impossibile completare la registrazione",
      });
    }

    // Gestiamo eventuali errori del server
    return res.status(500).json({
      message: "Errore durante la registrazione",
    });
  }
};

// LOGIN UTENTE

export const login = async (req, res) => {
  try {
    // Recuperiamo email e password
    const { email, password } = req.body ?? {};

    // Controlliamo che i dati siano presenti
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

    // Normalizziamo l'email
    const normalizedEmail = email.trim().toLowerCase();

    // Cerchiamo l'utente nel database
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    // Controlliamo che l'utente esista
    if (!user || typeof user.passwordHash !== "string") {
      return res.status(401).json({
        message: "Email o password non corrette",
      });
    }

    // Verifichiamo la password con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email o password non corrette",
      });
    }

    // Blocchiamo gli account che non hanno verificato l'email
    if (user.status === "PENDING") {
      return res.status(403).json({
        message: "Devi verificare la tua email prima di accedere",
      });
    }

    // Generiamo il token JWT
    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    // Restituiamo il token e i dati dell'utente
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
    return res.status(500).json({
      message: "Errore durante il login",
    });
  }
};

// LOGIN CON GOOGLE

export const googleLogin = async (req, res) => {
  // Recuperiamo la credenziale Google
  const { credential } = req.body ?? {};

  if (typeof credential !== "string" || !credential.trim()) {
    return res.status(400).json({
      message: "Credenziale Google mancante",
    });
  }

  // Verifichiamo la credenziale ricevuta
  let googleUser;

  try {
    googleUser = await verifyGoogleUser(credential);
  } catch (error) {
    return res.status(401).json({
      message: "Accesso Google non valido",
    });
  }

  try {
    // Cerchiamo un account collegato a Google
    let user = await User.findOne({
      googleId: googleUser.googleId,
    });

    // Se non esiste, controlliamo che l'email sia libera
    if (!user) {
      const existingUser = await User.findOne({
        email: googleUser.email,
      });

      // Non colleghiamo automaticamente account diversi
      if (existingUser) {
        return res.status(409).json({
          message: "Email già registrata. Accedi con email e password.",
        });
      }

      // Creiamo il nuovo account Google
      user = await User.create({
        firstName: googleUser.firstName,
        email: googleUser.email,
        googleId: googleUser.googleId,
      });
    }

    // Generiamo il JWT della nostra applicazione
    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    // Restituiamo il token e i dati dell'utente
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
