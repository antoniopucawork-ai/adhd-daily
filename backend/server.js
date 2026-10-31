import "dotenv/config";

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import mindDumpRoutes from "./routes/mindDumpRoutes.js";

// Configurazione generale
const app = express();

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

// Origini autorizzate tramite variabile d'ambiente
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Porte utilizzate normalmente da Vite durante lo sviluppo
const LOCAL_VITE_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):517[3-9]$/;

// Verifica se un'origine è autorizzata
const isAllowedOrigin = (origin) => {
  // Le richieste senza Origin possono provenire
  // da strumenti come curl o Bruno.
  // L'autenticazione rimane responsabilità delle rotte.
  if (!origin) {
    return true;
  }

  // Origini esplicitamente configurate
  if (configuredOrigins.includes(origin)) {
    return true;
  }

  // In sviluppo autorizziamo le porte locali di Vite
  if (!isProduction) {
    return LOCAL_VITE_ORIGIN.test(origin);
  }

  return false;
};

// Middleware CORS
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Limite per le richieste JSON
app.use(
  express.json({
    limit: "1mb",
  }),
);

// Rotta di verifica
app.get("/", (req, res) => {
  res.status(200).json({
    message: "ADHD Daily API funzionante!",
  });
});

// Rotte dell'applicazione
app.use("/api/auth", authRoutes);
app.use("/api/mind-dumps", mindDumpRoutes);

// Gestione degli endpoint inesistenti
app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint non trovato",
  });
});

// Gestione centralizzata degli errori
app.use((error, req, res, next) => {
  console.error("Errore server:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  // JSON malformato
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      message: "Il JSON inviato non è valido",
    });
  }

  // Richiesta troppo grande
  if (error.status === 413) {
    return res.status(413).json({
      message: "La richiesta supera la dimensione consentita",
    });
  }

  // Errori HTTP esplicitamente riconosciuti
  if (
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return res.status(error.status).json({
      message: "Richiesta non valida",
    });
  }

  // Errore interno
  return res.status(500).json({
    message: "Si è verificato un errore interno al server",
  });
});

// Avvio del server dopo la connessione a MongoDB
const startServer = async () => {
  try {
    // Evita di avviare le API senza database
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server ADHD Daily avviato sulla porta ${PORT}`);
    });
  } catch (error) {
    console.error("Errore durante l'avvio del server:", error.message);

    process.exit(1);
  }
};

startServer();
