import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import { login, googleLogin } from "../controllers/authController.js";
// TEST LOGIN ACCOUNT GOOGLE

test("un account Google senza password non può usare il login tradizionale", async (t) => {
  // 1. Simuliamo un utente Google senza password
  t.mock.method(User, "findOne", () => ({
    select: async () => ({
      email: "google@example.test",
      googleId: "google-123",
    }),
  }));

  // 2. Prepariamo una risposta Express simulata
  let statusCode;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  // 3. Proviamo ad accedere con una password
  const req = {
    body: {
      email: "google@example.test",
      password: "password-di-prova",
    },
  };

  await login(req, res);

  // 4. Verifichiamo che l'accesso venga rifiutato
  assert.equal(statusCode, 401);
  assert.equal(responseBody.message, "Email o password non corrette");
  assert.equal(responseBody.token, undefined);
});

// TEST LOGIN GOOGLE

test("Google Login rifiuta una credenziale mancante", async () => {
  // 1. Simuliamo una richiesta senza credenziale
  const req = {
    body: {},
  };

  // 2. Simuliamo la risposta Express
  let statusCode;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  // 3. Eseguiamo il controller
  await googleLogin(req, res);

  // 4. Controlliamo la risposta
  assert.equal(statusCode, 400);
  assert.equal(responseBody.token, undefined);
});

test("Google Login rifiuta una credenziale non valida", async () => {
  // 1. Simuliamo una credenziale sbagliata
  const req = {
    body: {
      credential: "token-non-valido",
    },
  };

  // 2. Simuliamo la risposta Express
  let statusCode;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  // 3. Eseguiamo il controller
  await googleLogin(req, res);

  // 4. Controlliamo che l'accesso sia negato
  assert.equal(statusCode, 401);
  assert.equal(responseBody.token, undefined);
});
