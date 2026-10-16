import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
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

  try {
    // 4. Verifichiamo firma e scadenza
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // 5. Controlliamo che il token contenga un ID utente valido
    if (
      typeof decoded.sub !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(decoded.sub)
    ) {
      return res.status(401).json({
        message: "Token non valido",
      });
    }

    // 6. Rendiamo disponibile l'identità alle rotte protette
    req.userId = decoded.sub;

    // 7. Passiamo alla funzione successiva
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token non valido o scaduto",
    });
  }
};
