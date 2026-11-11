export const sendVerificationEmail = async (email, token) => {
  // 1. Prepariamo il link di verifica
  const frontendUrl = process.env.FRONTEND_URL?.split(",")[0]
    ?.trim()
    .replace(/\/$/, "");

  if (!frontendUrl) {
    throw new Error("URL del frontend non configurato");
  }

  const verificationLink = `${frontendUrl}/verify-account?token=${encodeURIComponent(token)}`;

  // 2. Chiediamo a Brevo di inviare l'email
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
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
      textContent: `Per attivare il tuo account, apri questo link:

${verificationLink}

Il link scade tra 5 minuti.`,
    }),
  });

  // 3. Controlliamo se Brevo ha accettato l'invio
  if (!response.ok) {
    throw new Error("Invio email di verifica non riuscito");
  }
};
