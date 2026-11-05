import { HOUR, MINUTE, rateLimit } from "express-rate-limit";

const headers = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
};

// Con il trust proxy predefinito, Express usa l'indirizzo del socket.
// Ignoriamo X-Forwarded-For e il relativo avviso della libreria.
const byIp = { ...headers, validate: { xForwardedForHeader: false, forwardedHeader: false } };

export const loginRateLimit = rateLimit({
  ...byIp,
  windowMs: 15 * MINUTE,
  limit: 10,
  message: { message: "Troppi tentativi di accesso. Riprova più tardi." },
});

export const registerRateLimit = rateLimit({
  ...byIp,
  windowMs: HOUR,
  limit: 5,
  message: { message: "Troppe richieste di registrazione. Riprova più tardi." },
});

export const analyzeRateLimit = rateLimit({
  ...headers,
  windowMs: 10 * MINUTE,
  limit: 12,
  // La rotta verifica il JWT prima di applicare il limite.
  keyGenerator: (req) => req.userId.toLowerCase(),
  message: { message: "Troppe richieste di analisi. Riprova più tardi." },
});
