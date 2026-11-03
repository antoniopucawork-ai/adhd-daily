import { GoogleGenAI } from "@google/genai";
import { validateItemDate } from "./mindEngineValidator.js";

const ALLOWED_TYPES = ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"];

const MAX_TEXT_LENGTH = 10000;
const MAX_ITEMS = 20;
const MAX_TITLE_LENGTH = 200;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Recupera la data corrente in Italia.
const getCurrentDateContext = () => {
  const now = new Date();

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const getPart = (type) => dateParts.find((part) => part.type === type)?.value;

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

// Controlla la struttura della risposta Gemini.
const isValidItem = (item) => {
  return (
    item !== null &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    ALLOWED_TYPES.includes(item.type) &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    item.title.length <= MAX_TITLE_LENGTH &&
    (item.date === null ||
      (typeof item.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date))) &&
    (item.time === null ||
      (typeof item.time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time))) &&
    typeof item.uncertain === "boolean" &&
    (item.temporalExpression === null ||
      (typeof item.temporalExpression === "string" &&
        item.temporalExpression.trim().length > 0))
  );
};

// Istruzioni per Gemini.
const buildSystemInstruction = (currentDate, currentDay) => `
Sei il Mind Engine di ADHD Daily.

Il tuo compito è interpretare i pensieri scritti
dall'utente e organizzarli senza alterarne il significato.

CONTESTO TEMPORALE:
- Data corrente: ${currentDate}
- Giorno corrente: ${currentDay}
- Fuso orario: Europe/Rome

CLASSIFICAZIONE:

ACTION:
Un'azione concreta da svolgere.

EVENT:
Un appuntamento o evento programmato.

MEMORY:
Un ricordo o un fatto passato.

INTENTION:
Una possibilità, un desiderio o un piano non confermato.

THOUGHT:
Una riflessione o un pensiero personale.

REGOLE GENERALI:

- Identifica soltanto informazioni presenti nel testo.
- Suddividi il testo in elementi distinti quando necessario.
- Non inventare informazioni.
- Non aggiungere consigli.
- Non creare attività non richieste.
- Non trasformare intenzioni in azioni certe.
- Conserva il significato originale.
- Se la classificazione non è affidabile,
  utilizza THOUGHT e uncertain true.
- Non generare più di ${MAX_ITEMS} elementi.
- Ogni titolo deve avere al massimo ${MAX_TITLE_LENGTH} caratteri.
- Non inventare elementi per raggiungere un numero minimo.
- Non troncare il significato di un pensiero per rispettare un limite.

REGOLE TEMPORALI:

- Interpreta le date rispetto al contesto fornito.
- Utilizza il formato YYYY-MM-DD.
- Se una data non è determinabile, utilizza null.
- Se un orario non è indicato, utilizza null.
- Non inventare date o orari.
- Non scegliere arbitrariamente tra date contraddittorie.
- Non scegliere arbitrariamente tra orari contraddittori.
- Se soltanto la data è incerta, conserva l'orario affidabile.
- Se soltanto l'orario è incerto, conserva la data affidabile.

ESPRESSIONI TEMPORALI:

Ogni elemento deve contenere temporalExpression.

Il campo deve riportare esattamente le parole
utilizzate dall'utente per indicare la data.

Esempi:

"Domani devo chiamare Marco"
temporalExpression: "Domani"

"Lunedì ho il dentista"
temporalExpression: "Lunedì"

"Devo comprare il latte"
temporalExpression: null

Non inventare espressioni temporali.

Se non è presente alcun riferimento temporale,
utilizza temporalExpression null.

DATE RELATIVE:

- "oggi" indica la data corrente.
- "domani" indica il giorno successivo.
- "dopodomani" indica due giorni dopo.
- Per un giorno della settimana senza qualificatori,
  considera la prossima occorrenza,
  includendo oggi se coincide.
- Se l'utente indica una data esplicita,
  rispettala nel significato, ma non inventarla.

DATE AMBIGUE:

Espressioni come "venerdì prossimo" e
"lunedì prossimo" possono essere ambigue.

Se non puoi stabilire con certezza la data intesa,
utilizza date null e uncertain true.

Non risolvere autonomamente un'ambiguità.

INCERTEZZA:

- Se l'utente dice "forse", conserva l'incertezza.
- Una possibilità non confermata è INTENTION.
- Una INTENTION può avere una data precisa.
- La presenza di una data non rende certa un'intenzione.
- Se soltanto una parte è incerta,
  conserva le altre informazioni affidabili.

ESEMPI:

Testo:
"Devo comprare il latte."

Risultato:
{
  "type": "ACTION",
  "title": "Comprare il latte",
  "date": null,
  "time": null,
  "uncertain": false,
  "temporalExpression": null
}

Testo:
"Venerdì prossimo forse incontro Marco."

Risultato:
{
  "type": "INTENTION",
  "title": "Incontrare Marco",
  "date": null,
  "time": null,
  "uncertain": true,
  "temporalExpression": "Venerdì prossimo"
}

Testo:
"Ho bisogno di riposarmi."

Risultato:
{
  "type": "THOUGHT",
  "title": "Ho bisogno di riposarmi",
  "date": null,
  "time": null,
  "uncertain": false,
  "temporalExpression": null
}

FORMATO DELLA RISPOSTA:

Restituisci esclusivamente un oggetto JSON:

{
  "items": [
    {
      "type": "ACTION",
      "title": "Descrizione dell'elemento",
      "date": null,
      "time": null,
      "uncertain": false,
      "temporalExpression": null
    }
  ]
}

Ogni elemento deve contenere:
- type
- title
- date
- time
- uncertain
- temporalExpression

Non aggiungere testo esterno al JSON.
`;

// Analizza il pensiero tramite Gemini.
export const analyzeThought = async (originalText) => {
  if (
    typeof originalText !== "string" ||
    !originalText.trim() ||
    originalText.length > MAX_TEXT_LENGTH
  ) {
    throw new Error("Testo del Mind Dump non valido");
  }

  const cleanText = originalText.trim();

  const { currentDate, currentDay } = getCurrentDateContext();

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: cleanText,
    config: {
      systemInstruction: buildSystemInstruction(currentDate, currentDay),
      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("Gemini non ha restituito alcuna risposta");
  }

  let result;

  try {
    result = JSON.parse(response.text);
  } catch {
    throw new Error("Gemini ha restituito un JSON non valido");
  }

  // Nessun dato viene salvato in questa fase.
  // Controlliamo la risposta prima di inviarla al frontend.
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result) ||
    !Array.isArray(result.items) ||
    result.items.length === 0 ||
    result.items.length > MAX_ITEMS ||
    !result.items.every(isValidItem)
  ) {
    throw new Error("La risposta del Mind Engine non è valida");
  }

  // Controlliamo la coerenza delle date e degli orari.
  const validatedItems = result.items.map((item) =>
    validateItemDate(item, cleanText, currentDate),
  );

  return {
    items: validatedItems,
  };
};
