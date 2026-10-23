import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import mindDumpRoutes from "./routes/mindDumpRoutes.js";
import cors from "cors";
const app = express();

const PORT = process.env.PORT || 3001;

// Middleware

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/mind-dumps", mindDumpRoutes);
// Rotta di verifica
app.get("/", (req, res) => {
  res.status(200).json({
    message: "ADHD Daily API funzionante!",
  });
});

// Avvio del server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server ADHD Daily avviato sulla porta ${PORT}`);
    });
  } catch (error) {
    console.error("Errore durante l'avvio:", error.message);
    process.exit(1);
  }
};

startServer();
