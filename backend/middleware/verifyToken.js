import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  // 1. Recuperiamo l'header Authorization
  const authHeader = req.headers.authorization;

  // 2. Verifichiamo il formato Bearer TOKEN
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Accesso non autorizzato",
    });
  }

  // 3. Estraiamo il token
  const token = authHeader.slice(7);

  let decoded;

  try {
    // 4. Verifichiamo firma e scadenza
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return res.status(401).json({
      message: "Token non valido o scaduto",
    });
  }

  // 5. Controlliamo che il token contenga un ID valido
  if (
    typeof decoded.sub !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(decoded.sub)
  ) {
    return res.status(401).json({
      message: "Token non valido",
    });
  }

  try {
    // 6. Cerchiamo l'utente nel database
    const user = await User.findById(decoded.sub);

    // 7. Controlliamo che l'utente esista
    if (!user) {
      return res.status(401).json({
        message: "Utente non autorizzato",
      });
    }

    // 8. Controlliamo che l'account sia attivo
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Devi verificare la tua email prima di accedere",
      });
    }

    // 9. Rendiamo disponibile l'ID dell'utente
    req.userId = decoded.sub;

    // 10. Passiamo alla funzione successiva
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Errore durante la verifica dell'utente",
    });
  }
};
