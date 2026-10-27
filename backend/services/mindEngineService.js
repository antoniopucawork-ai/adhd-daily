import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Recupera la data corrente nel fuso orario italiano
const getCurrentDateContext = () => {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(now);

  const getPart = (type) => parts.find((part) => part.type === type)?.value;

  const currentDate = [getPart("year"), getPart("month"), getPart("day")].join(
    "-",
  );

  const currentDay = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
  }).format(now);

  return {
    currentDate,
    currentDay,
  };
};

// Analizza un pensiero utilizzando Gemini
export const analyzeThought = async (originalText) => {
  const { currentDate, currentDay } = getCurrentDateContext();

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: originalText,

    config: {
      systemInstruction: `
Sei il Mind Engine di ADHD Daily.

Il tuo compito è interpretare i pensieri scritti dall'utente
e organizzarli senza alterarne il significato.

CONTESTO TEMPORALE:
- Data corrente: ${currentDate}
- Giorno della settimana: ${currentDay}
- Fuso orario: Europe/Rome

REGOLE DI CLASSIFICAZIONE:
- Identifica soltanto le informazioni presenti nel testo.
- Suddividi il testo in elementi distinti quando necessario.
- Classifica ogni elemento utilizzando uno dei seguenti tipi:

ACTION: un'azione concreta da svolgere.
EVENT: un evento o appuntamento.
MEMORY: un ricordo o un fatto passato.
INTENTION: una possibilità, un desiderio o un'intenzione non confermata.
THOUGHT: una riflessione o un pensiero personale.

REGOLE IMPORTANTI:
- Non inventare informazioni.
- Non aggiungere consigli o attività non richieste.
- Non trasformare intenzioni in azioni certe.
- Conserva il significato originale del pensiero.
- Se un'informazione è incerta, imposta uncertain a true.
- Se non puoi classificare un elemento con sufficiente affidabilità,
  utilizza THOUGHT e imposta uncertain a true.

REGOLE TEMPORALI:
- Interpreta le date relative rispetto alla data corrente.
- Se una data è determinabile, utilizza il formato YYYY-MM-DD.
- Se una data non è determinabile con sufficiente certezza, usa null.
- Se un orario non è specificato, usa null.
- Non inventare date o orari.
- Non considerare automaticamente confermata un'intenzione futura.

FORMATO DELLA RISPOSTA:
Restituisci esclusivamente un oggetto JSON con questa struttura:

{
  "items": [
    {
      "type": "ACTION",
      "title": "Descrizione dell'elemento",
      "date": null,
      "time": null,
      "uncertain": false
    }
  ]
}

Ogni elemento deve contenere:
- type
- title
- date
- time
- uncertain

Non aggiungere testo esterno al JSON.
      `,

      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("Gemini non ha restituito alcuna risposta");
  }

  const result = JSON.parse(response.text);

  const allowedTypes = ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"];

  const isValidItem = (item) => {
    return (
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      allowedTypes.includes(item.type) &&
      typeof item.title === "string" &&
      item.title.trim().length > 0 &&
      (item.date === null ||
        (typeof item.date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.date))) &&
      (item.time === null ||
        (typeof item.time === "string" &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time))) &&
      typeof item.uncertain === "boolean"
    );
  };

  if (
    !result ||
    typeof result !== "object" ||
    !Array.isArray(result.items) ||
    !result.items.every(isValidItem)
  ) {
    throw new Error("La risposta del Mind Engine non è valida");
  }

  return result;
};
