import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

// Verifica che la credenziale arrivi davvero da Google.
export async function verifyGoogleUser(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Google Login non configurato");
  }

  if (typeof credential !== "string" || !credential) {
    throw new Error("Credenziale Google mancante");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  const googleUser = ticket.getPayload();

  if (
    !googleUser?.sub ||
    !googleUser?.email ||
    googleUser.email_verified !== true
  ) {
    throw new Error("Identità Google non valida");
  }

  return {
    googleId: googleUser.sub,
    email: googleUser.email.toLowerCase(),
    firstName: googleUser.given_name || "Utente",
  };
}
