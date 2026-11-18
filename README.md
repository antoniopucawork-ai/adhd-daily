# ADHD Daily

**ADHD Daily** è un'applicazione web mobile-first sviluppata come progetto finale del percorso Full Stack Developer di EPICODE.

L'obiettivo è aiutare le persone a organizzare pensieri, attività e impegni quotidiani attraverso un'interfaccia semplice, personalizzabile e supportata dall'intelligenza artificiale.

Il principio alla base del progetto è semplice: **non deve essere l'utente ad adattarsi all'applicazione, ma l'applicazione alle esigenze dell'utente.**

## Il progetto

ADHD Daily nasce dall'idea di creare uno spazio digitale nel quale poter scrivere liberamente ciò che si ha in mente, senza dover prima classificare o organizzare ogni pensiero.

La funzionalità centrale è il **Mind Dump**.

L'utente inserisce un testo libero e il sistema, attraverso l'integrazione con Gemini, propone una suddivisione delle informazioni in attività, eventi, ricordi, intenzioni e pensieri.

Prima del salvataggio è possibile verificare e correggere i risultati. Il sistema conserva anche il testo originale e gestisce le informazioni incerte evitando di assegnare arbitrariamente date o dettagli mancanti.

## Funzionalità principali

- Registrazione, verifica email e autenticazione tramite JWT.
- Accesso tramite Google.
- Mind Dump con analisi del testo attraverso Gemini.
- Revisione e modifica dei risultati dell'intelligenza artificiale.
- Home con attività della giornata e prossimo passo.
- Organizzazione e gestione di attività, eventi e pensieri.
- Calendario interno.
- Esportazione manuale degli eventi compatibili verso Google Calendar.
- Archivio dei Mind Dump e dei testi originali.
- Personalizzazione dei moduli della Home.
- Interfaccia responsive con supporto ai temi chiaro e scuro.

## Tecnologie utilizzate

### Frontend
- React
- Vite
- JavaScript
- CSS
- React Router

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Token (JWT)

### Integrazioni
- Google Gemini API
- Google Identity Services
- Google Calendar

## Architettura

Il progetto è organizzato in due parti principali:

- `frontend/` — interfaccia React, pagine, componenti, servizi e gestione dell'esperienza utente.
- `backend/` — API REST, autenticazione, middleware, modelli MongoDB e servizi per l'elaborazione dei Mind Dump.

Il frontend comunica con il backend attraverso richieste HTTP. Le operazioni sui dati personali sono protette tramite autenticazione e controlli di autorizzazione.

L'elaborazione con Gemini avviene tramite il backend, senza esporre la chiave API nel frontend.

## Avvio in locale

Per eseguire il progetto è necessario avere Node.js e npm installati.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

**Backend**

```bash
cd backend
npm install
npm start
```

Il backend richiede la configurazione delle variabili d'ambiente necessarie per database, autenticazione e servizi esterni.

Le credenziali e le chiavi API non sono incluse nel repository.

## Test

Il progetto comprende test automatici frontend e backend, utilizzati per verificare la logica applicativa, l'autenticazione, la gestione dei dati e il comportamento del Mind Engine.

## Demo online

**[Apri ADHD Daily](https://adhd-daily.vercel.app/benvenuto)**

## Obiettivo e sviluppi futuri

ADHD Daily è attualmente un progetto didattico e un prototipo funzionante. Non è uno strumento medico né un sistema per la diagnosi o il trattamento dell'ADHD.

Tra i possibili sviluppi futuri rientrano il miglioramento dell'accessibilità, una personalizzazione più avanzata dell'interfaccia e ulteriori strumenti per l'organizzazione quotidiana.

---

**Progetto sviluppato da Antonio Puca — Capstone EPICODE, 2026.**
