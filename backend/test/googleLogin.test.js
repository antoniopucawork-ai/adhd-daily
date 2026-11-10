import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import { login, googleLogin } from "../controllers/authController.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
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
test("Google Login crea un nuovo utente e restituisce un JWT", async (t) => {
  // Configurazione controllata per il test
  const oldClientId = process.env.GOOGLE_CLIENT_ID;
  const oldSecret = process.env.JWT_SECRET;

  process.env.GOOGLE_CLIENT_ID = "client-id-di-test";
  process.env.JWT_SECRET = "segreto-usato-soltanto-nei-test";

  t.after(() => {
    if (oldClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = oldClientId;

    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });

  // Simuliamo una credenziale già verificata da Google
  t.mock.method(OAuth2Client.prototype, "verifyIdToken", async (options) => {
    assert.equal(options.audience, "client-id-di-test");

    return {
      getPayload: () => ({
        sub: "google-123",
        email: "google@example.test",
        email_verified: true,
        given_name: "Mario",
      }),
    };
  });

  // Il nuovo utente non esiste ancora
  t.mock.method(User, "findOne", async () => null);

  let createdUser;

  t.mock.method(User, "create", async (data) => {
    createdUser = data;

    return {
      _id: "507f1f77bcf86cd799439011",
      ...data,
    };
  });

  const req = {
    body: { credential: "credenziale-di-test" },
  };

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

  await googleLogin(req, res);

  // Controlliamo il risultato
  assert.equal(statusCode, 200);
  assert.equal(createdUser.googleId, "google-123");
  assert.equal(responseBody.user.email, "google@example.test");

  // Controlliamo che il JWT sia valido
  const payload = jwt.verify(responseBody.token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  assert.equal(payload.sub, "507f1f77bcf86cd799439011");
});
test("Google Login recupera un utente già registrato", async (t) => {
  const oldClientId = process.env.GOOGLE_CLIENT_ID;
  const oldSecret = process.env.JWT_SECRET;

  process.env.GOOGLE_CLIENT_ID = "client-id-di-test";
  process.env.JWT_SECRET = "segreto-usato-soltanto-nei-test";

  t.after(() => {
    if (oldClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = oldClientId;

    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });

  // Google conferma l'identità
  t.mock.method(OAuth2Client.prototype, "verifyIdToken", async () => ({
    getPayload: () => ({
      sub: "google-123",
      email: "google@example.test",
      email_verified: true,
      given_name: "Mario",
    }),
  }));

  const existingUser = {
    _id: "507f1f77bcf86cd799439011",
    firstName: "Mario",
    email: "google@example.test",
  };

  // Simuliamo il ritrovamento dell'account
  const findMock = t.mock.method(User, "findOne", async () => existingUser);

  // Controlliamo che non venga creato un nuovo account
  const createMock = t.mock.method(User, "create", async () => {
    throw new Error("Non deve creare un nuovo utente");
  });

  const req = {
    body: { credential: "credenziale-di-test" },
  };

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

  await googleLogin(req, res);

  assert.equal(statusCode, 200);
  assert.equal(findMock.mock.callCount(), 1);
  assert.equal(createMock.mock.callCount(), 0);

  const payload = jwt.verify(responseBody.token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  assert.equal(payload.sub, existingUser._id);
  assert.equal(responseBody.user.email, existingUser.email);
});
test("Google Login non collega automaticamente un'email già registrata", async (t) => {
  const oldClientId = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = "client-id-di-test";

  t.after(() => {
    if (oldClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = oldClientId;
  });

  // Simuliamo una credenziale Google valida
  t.mock.method(OAuth2Client.prototype, "verifyIdToken", async () => ({
    getPayload: () => ({
      sub: "google-456",
      email: "mario@example.test",
      email_verified: true,
      given_name: "Mario",
    }),
  }));

  // Nessun account con questo Google ID,
  // ma l'email appartiene già a un utente tradizionale
  const findMock = t.mock.method(User, "findOne", async (query) => {
    if (query.googleId === "google-456") return null;

    if (query.email === "mario@example.test") {
      return {
        _id: "507f1f77bcf86cd799439011",
        email: "mario@example.test",
      };
    }

    throw new Error("Ricerca inattesa");
  });

  const createMock = t.mock.method(User, "create", async () => {
    throw new Error("Non deve creare utenti");
  });

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

  await googleLogin({ body: { credential: "credenziale-di-test" } }, res);

  assert.equal(statusCode, 409);
  assert.equal(responseBody.token, undefined);
  assert.equal(findMock.mock.callCount(), 2);
  assert.equal(createMock.mock.callCount(), 0);
});
