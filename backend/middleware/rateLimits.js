import { HOUR, MINUTE, rateLimit } from "express-rate-limit";

// Configurazione comune per comunicare
// al client i limiti delle richieste.
const headers = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
};

// Configurazione per le richieste limitate per IP.
//
// Questi due controlli diagnostici sono disabilitati.
// La configurazione del proxy va verificata
// prima della pubblicazione dell'app.
const byIp = {
  ...headers,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
};

// LOGIN
// Massimo 10 richieste ogni 15 minuti per IP.
export const loginRateLimit = rateLimit({
  ...byIp,
  windowMs: 15 * MINUTE,
  limit: 10,
  message: {
    message: "Troppi tentativi di accesso. Riprova più tardi.",
  },
});

// REGISTRAZIONE
// Massimo 5 richieste ogni ora per IP.
export const registerRateLimit = rateLimit({
  ...byIp,
  windowMs: HOUR,
  limit: 5,
  message: {
    message: "Troppe richieste di registrazione. Riprova più tardi.",
  },
});

// ANALISI MIND DUMP
// Massimo 12 richieste a Gemini ogni 10 minuti
// per ogni utente autenticato.
//
// IMPORTANTE: verifyToken deve essere eseguito
// prima di questo middleware.
export const analyzeRateLimit = rateLimit({
  ...headers,
  windowMs: 10 * MINUTE,
  limit: 12,

  // Identifichiamo l'utente tramite il suo ID,
  // non tramite l'indirizzo IP.
  keyGenerator: (req) => req.userId.toLowerCase(),

  message: {
    message: "Troppe richieste di analisi. Riprova più tardi.",
  },
});
