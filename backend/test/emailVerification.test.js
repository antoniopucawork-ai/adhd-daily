import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";

import User from "../models/User.js";
import {
  verifyAccount,
  resendVerification,
} from "../controllers/emailVerificationController.js";

// Creiamo una risposta fittizia di Express
function mockResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      return this;
    },
  };
}

// Usiamo sempre un token fittizio
const token = "a".repeat(64);

const tokenHash = createHash("sha256").update(token).digest("hex");

// VERIFICA TOKEN NON VALIDO

test("rifiuta un token non valido", async () => {
  const res = mockResponse();

  await verifyAccount({ body: { token: "token-sbagliato" } }, res);

  assert.equal(res.statusCode, 400);
});

// ATTIVAZIONE ACCOUNT E TOKEN MONOUSO

test("attiva l'account una sola volta", async (context) => {
  const user = {
    status: "PENDING",
    tokenHash,
    expiresAt: new Date(Date.now() + 60_000),
  };

  // Simuliamo la ricerca e l'aggiornamento su MongoDB
  context.mock.method(User, "findOneAndUpdate", async (filter, update) => {
    const valid =
      user.status === filter.status &&
      user.tokenHash === filter.emailVerificationTokenHash &&
      user.expiresAt > filter.emailVerificationExpiresAt.$gt;

    if (!valid) return null;

    user.status = update.$set.status;

    return user;
  });

  const firstResponse = mockResponse();

  await verifyAccount({ body: { token } }, firstResponse);

  assert.equal(firstResponse.statusCode, 200);
  assert.equal(user.status, "ACTIVE");

  // Proviamo a utilizzare lo stesso token una seconda volta
  const secondResponse = mockResponse();

  await verifyAccount({ body: { token } }, secondResponse);

  assert.equal(secondResponse.statusCode, 400);
});

// SCADENZA DEL TOKEN

test("rifiuta un token scaduto", async (context) => {
  const expiredAt = new Date(Date.now() - 1000);

  context.mock.method(User, "findOneAndUpdate", async (filter) => {
    // La query deve richiedere una scadenza futura
    assert.equal(filter.status, "PENDING");
    assert.equal(filter.emailVerificationTokenHash, tokenHash);

    const requiredDate = filter.emailVerificationExpiresAt.$gt;

    assert.ok(requiredDate instanceof Date);
    assert.ok(expiredAt < requiredDate);

    // MongoDB non trova un token già scaduto
    return null;
  });

  const res = mockResponse();

  await verifyAccount({ body: { token } }, res);

  assert.equal(res.statusCode, 400);
});

// REINVIO EMAIL

test("il reinvio rispetta il controllo dei 60 secondi", async (context) => {
  let called = false;

  context.mock.method(User, "findOneAndUpdate", async (filter) => {
    called = true;

    assert.equal(filter.status, "PENDING");
    assert.equal(filter.email, "utente@example.test");

    // Controlliamo la data limite per il reinvio
    const limit = filter.$or[1].emailVerificationSentAt.$lte;

    assert.ok(limit instanceof Date);

    const seconds = (Date.now() - limit.getTime()) / 1000;

    assert.ok(seconds >= 59);
    assert.ok(seconds <= 61);

    // Simuliamo un account ancora nel periodo di attesa
    return null;
  });

  // Nessuna email deve partire in questo caso
  context.mock.method(globalThis, "fetch", () => {
    throw new Error("Non doveva essere inviata alcuna email");
  });

  const res = mockResponse();

  await resendVerification({ body: { email: "utente@example.test" } }, res);

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});
