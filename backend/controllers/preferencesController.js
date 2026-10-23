import User from "../models/User.js";

// Questi sono gli unici moduli che possiamo salvare.
// Non accettiamo moduli inventati o non ancora disponibili.
const ALLOWED_MODULES = ["mindDump", "today", "nextStep"];

// Qui controlliamo le preferenze prima di salvarle.
export const updatePreferences = async (req, res) => {
  try {
    const { onboardingCompleted, homeModules } = req.body;

    // Controlliamo che siano arrivati i dati richiesti.
    if (
      typeof onboardingCompleted !== "boolean" ||
      !Array.isArray(homeModules)
    ) {
      return res.status(400).json({
        message: "Preferenze non valide",
      });
    }

    // Per ora vogliamo una configurazione per tutti e tre i moduli.
    if (homeModules.length !== ALLOWED_MODULES.length) {
      return res.status(400).json({
        message: "La configurazione dei moduli non è completa",
      });
    }

    const moduleIds = homeModules.map((module) => module?.id);
    const moduleOrders = homeModules.map((module) => module?.order);

    // Controlliamo che ogni modulo sia valido.
    const validModules = homeModules.every(
      (module) =>
        module !== null &&
        typeof module === "object" &&
        !Array.isArray(module) &&
        ALLOWED_MODULES.includes(module.id) &&
        typeof module.enabled === "boolean" &&
        Number.isInteger(module.order) &&
        module.order >= 0 &&
        module.order < ALLOWED_MODULES.length,
    );

    // Controlliamo che non ci siano moduli o posizioni duplicate.
    const uniqueIds = new Set(moduleIds).size === ALLOWED_MODULES.length;
    const uniqueOrders = new Set(moduleOrders).size === ALLOWED_MODULES.length;

    if (!validModules || !uniqueIds || !uniqueOrders) {
      return res.status(400).json({
        message: "Configurazione dei moduli non valida",
      });
    }

    // Salviamo soltanto i campi che abbiamo controllato.
    const cleanModules = homeModules.map((module) => ({
      id: module.id,
      enabled: module.enabled,
      order: module.order,
    }));

    // Cerchiamo l'utente attraverso l'ID presente nel token.
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        message: "Utente non autorizzato",
      });
    }

    // Aggiorniamo le preferenze dell'utente.
    user.set("preferences.onboardingCompleted", onboardingCompleted);
    user.set("preferences.homeModules", cleanModules);

    await user.save();

    // Restituiamo la configurazione appena salvata.
    return res.status(200).json({
      message: "Preferenze salvate correttamente",
      preferences: {
        onboardingCompleted: user.preferences.onboardingCompleted,
        homeModules: cleanModules,
      },
    });
  } catch (error) {
    console.error("Errore durante il salvataggio delle preferenze:", error);

    return res.status(500).json({
      message: "Errore durante il salvataggio delle preferenze",
    });
  }
};
