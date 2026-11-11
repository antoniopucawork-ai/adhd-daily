import User from "../models/User.js";
import { randomBytes, createHash } from "node:crypto";
import { sendVerificationEmail } from "../services/emailService.js";

// VERIFICA EMAIL UTENTE

export const verifyAccount = async (req, res) => {
  try {
    // 1. Recuperiamo il token
    const { token } = req.body ?? {};

    // 2. Controlliamo il formato del token
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Link non valido o scaduto",
      });
    }

    // 3. Creiamo l'hash del token ricevuto
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // 4. Cerchiamo l'account e lo attiviamo
    const user = await User.findOneAndUpdate(
      {
        status: "PENDING",
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: new Date() },
      },
      {
        $set: { status: "ACTIVE" },
        $unset: {
          emailVerificationTokenHash: "",
          emailVerificationExpiresAt: "",
          emailVerificationSentAt: "",
        },
      },
    );

    // 5. Controlliamo se abbiamo trovato l'account
    if (!user) {
      return res.status(400).json({
        message: "Link non valido o scaduto",
      });
    }

    // 6. Confermiamo l'attivazione
    return res.status(200).json({
      message: "Account verificato! Ora puoi accedere.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore durante la verifica dell'account",
    });
  }
};

// REINVIO EMAIL DI VERIFICA

export const resendVerification = async (req, res) => {
  try {
    // 1. Recuperiamo l'email
    const { email } = req.body ?? {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Inserisci un indirizzo email",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Generiamo un nuovo token
    const verificationToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const now = new Date();

    // 3. Cerchiamo un account PENDING
    // e controlliamo che siano passati almeno 60 secondi
    const user = await User.findOneAndUpdate(
      {
        email: normalizedEmail,
        status: "PENDING",
        $or: [
          { emailVerificationSentAt: { $exists: false } },
          {
            emailVerificationSentAt: {
              $lte: new Date(now.getTime() - 60 * 1000),
            },
          },
        ],
      },
      {
        $set: {
          emailVerificationTokenHash: tokenHash,
          emailVerificationExpiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          emailVerificationSentAt: now,
        },
      },
      { new: true },
    );

    // 4. Se troviamo l'utente, inviamo l'email
    if (user) {
      await sendVerificationEmail(user.email, verificationToken);
    }

    // 5. Restituiamo una risposta generica
    return res.status(200).json({
      message: "Se l'account è in attesa di verifica, riceverai un'email.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore durante il reinvio dell'email",
    });
  }
};
