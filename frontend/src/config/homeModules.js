// Qui definiamo i moduli che possiamo mostrare nella Home.
// L'utente potrà scegliere quali tenere, quali nascondere
// e in che ordine visualizzarli.
//
// Le sue scelte verranno salvate su MongoDB.
// Qui invece teniamo solo la configurazione iniziale
// e le informazioni dei moduli.

// Questa è la configurazione che trova l'utente
// quando entra per la prima volta nell'app.
//
// id: identifica il modulo.
// enabled: decide se mostrarlo oppure no.
// order: indica la sua posizione nella Home.
//
// L'utente potrà cambiare tutto durante la personalizzazione.

export const DEFAULT_HOME_MODULES = [
  {
    id: "mindDump",
    enabled: true,
    order: 0,
  },
  {
    id: "today",
    enabled: true,
    order: 1,
  },
  {
    id: "nextStep",
    enabled: true,
    order: 2,
  },
];

// ==========================================
// 2. INFORMAZIONI DEI MODULI
// ==========================================

// Questo oggetto contiene i testi descrittivi
// dei moduli disponibili.
//
// Verrà utilizzato principalmente nella
// schermata di personalizzazione.
//
// Esempio:
//
// Svuota la mente
// Uno spazio per liberare i tuoi pensieri.
// [Attiva / Disattiva]
//
// Le chiavi (mindDump, today, nextStep)
// devono corrispondere agli id presenti
// nella configurazione predefinita.
//
// IMPORTANTE:
// Modificare un titolo o una descrizione
// non modifica le preferenze degli utenti,
// perché queste utilizzano gli id.

export const HOME_MODULE_INFO = {
  mindDump: {
    title: "Svuota la mente",
    description: "Uno spazio per liberare i tuoi pensieri.",
  },

  today: {
    title: "La tua giornata",
    description: "Tieni a portata di mano le attività di oggi.",
  },

  nextStep: {
    title: "Il prossimo passo",
    description: "Concentrati su una cosa alla volta.",
  },
};
