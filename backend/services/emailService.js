export const sendVerificationEmail = async (email, token) => {
  // Prepariamo il link per verificare l'account
  const frontendUrl = process.env.FRONTEND_URL?.split(",")[0]
    ?.trim()
    .replace(/\/$/, "");

  if (!frontendUrl) {
    throw new Error("URL del frontend non configurato");
  }

  const verificationLink = `${frontendUrl}/verify-account?token=${encodeURIComponent(token)}`;

  // Inviamo l'email utilizzando Brevo
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),

    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },

    body: JSON.stringify({
      sender: {
        name: "ADHD Daily",
        email: process.env.BREVO_SENDER_EMAIL,
      },

      to: [{ email }],

      subject: "Verifica la tua email - ADHD Daily",

      // Versione testuale dell'email
      textContent: `Per attivare il tuo account, apri questo link:

${verificationLink}

Il link scade tra 5 minuti.`,

      // Versione HTML con collegamento cliccabile
      htmlContent: `
        <p>Ciao!</p>

        <p>
          Per attivare il tuo account ADHD Daily,
          verifica il tuo indirizzo email.
        </p>

        <p>
          <a href="${verificationLink}">
            Verifica la tua email
          </a>
        </p>

        <p>Il link scade tra 5 minuti.</p>

        <p>ADHD Daily</p>
      `,
    }),
  });

  // Controlliamo che Brevo abbia accettato la richiesta
  if (!response.ok) {
    throw new Error("Invio email di verifica non riuscito");
  }
};
