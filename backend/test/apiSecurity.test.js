import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

process.env.JWT_SECRET = "jwt-fittizio-per-test-locali";
process.env.GEMINI_API_KEY = "gemini-fittizio-per-test-locali";

const { default: authRoutes } = await import("../routes/authRoutes.js");
const { default: mindDumpRoutes } = await import("../routes/mindDumpRoutes.js");

const userA = "aaaaaaaaaaaaaaaaaaaaaaaa";
const userB = "bbbbbbbbbbbbbbbbbbbbbbbb";
const userC = "cccccccccccccccccccccccc";
const testPassword = "password-fittizia";
const email = "utente@example.test";
const originalText = "Comprare il latte";

async function startApi(context) {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/mind-dumps", mindDumpRoutes);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()),
  ));

  return (path, body, headers) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function bearer(userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

function mockGemini(context, respond) {
  const realFetch = globalThis.fetch;
  return context.mock.method(globalThis, "fetch", (input, options) => {
    const url = new URL(input);
    if (url.hostname === "127.0.0.1") return realFetch(input, options);
    assert.equal(url.hostname, "generativelanguage.googleapis.com");
    return respond(options.signal);
  });
}

function geminiResponse(text) {
  return Response.json({ candidates: [{ content: { parts: [{ text }] } }] });
}

test("auth mantiene le risposte esistenti e limita per IP anche con header inoltrati falsi", async (context) => {
  const hash = await bcrypt.hash(testPassword, 4);
  const findUser = context.mock.method(User, "findOne", ({ email: address }) => ({
    select: async () => address === email ? { _id: userA, email, passwordHash: hash } : null,
  }));
  const post = await startApi(context);

  const login = await post("/api/auth/login", { email, password: testPassword });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.id, userA);

  for (let i = 1; i <= 10; i++) {
    const response = await post("/api/auth/login", { email, password: "errata" }, {
      "X-Forwarded-For": `203.0.113.${i}`,
      Forwarded: `for=198.51.100.${i}`,
    });
    assert.equal(response.status, i === 10 ? 429 : 401);
    if (i === 10) {
      assert.ok(Number(response.headers.get("Retry-After")) > 0);
      assert.match((await response.json()).message, /Troppi tentativi/);
    }
  }
  assert.equal(findUser.mock.callCount(), 10);
  findUser.mock.mockImplementation(async () => null);


  const create = context.mock.method(User, "create", async (fields) => ({
    ...fields, _id: userB,
  }));
  const register = await post("/api/auth/register", {
    firstName: "Test", email: "nuovo@example.test", password: testPassword,
  });
  assert.equal(register.status, 201);
  const registered = await register.json();
  assert.equal(registered.user.id, userB);
  assert.equal(registered.user.passwordHash, undefined);
  for (let i = 1; i <= 5; i++) {
    const response = await post("/api/auth/register", {}, { "X-Forwarded-For": `203.0.113.${i}` });
    assert.equal(response.status, i === 5 ? 429 : 400);
    if (i === 5) assert.ok(Number(response.headers.get("Retry-After")) > 0);
  }
  assert.equal(create.mock.callCount(), 1);
});

test("analisi richiede un JWT, limita per utente e conserva il payload di successo", async (context) => {
  const item = { type: "ACTION", title: originalText, date: null, time: null, uncertain: false };
  const provider = context.mock.fn(() => geminiResponse(JSON.stringify({
    items: [{ ...item, originalFragment: originalText, temporalExpression: null }],
  })));
  mockGemini(context, provider);
  const post = await startApi(context);
  const path = "/api/mind-dumps/analyze";
  assert.equal((await post(path, { originalText })).status, 401);
  assert.equal(provider.mock.callCount(), 0);
  assert.equal((await post(path, {}, bearer(userA))).status, 400);
  assert.equal(provider.mock.callCount(), 0);

  for (let i = 0; i < 11; i++) {
    const response = await post(path, { originalText }, bearer(userA));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { items: [item] });
  }
  const blocked = await post(path, { originalText }, bearer(userA));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("Retry-After")) > 0);
  assert.match((await blocked.json()).message, /Troppe richieste di analisi/);
  assert.equal(provider.mock.callCount(), 11);
  assert.equal((await post(path, { originalText }, bearer(userB))).status, 200);
  assert.equal(provider.mock.callCount(), 12);
});

test("il timeout annulla il trasporto SDK e gli errori non rivelano dettagli interni", async (context) => {
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  let configuredTimeout;
  const shortTimeout = context.mock.method(AbortSignal, "timeout", (milliseconds) => {
    configuredTimeout = milliseconds;
    return timeout(25);
  });
  let aborted = false;
  const provider = context.mock.fn((signal) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => {
      aborted = true;
      reject(new Error("dettaglio interno riservato"));
    }, { once: true });
  }));
  mockGemini(context, provider);
  const post = await startApi(context);
  const send = () => post("/api/mind-dumps/analyze", { originalText }, bearer(userC));
  const timedOut = await send();
  assert.equal(configuredTimeout, 15_000);
  assert.equal(aborted, true);
  assert.equal(timedOut.status, 504);
  assert.deepEqual(await timedOut.json(), { message: "L’analisi ha impiegato troppo tempo. Riprova." });

  shortTimeout.mock.restore();

  context.mock.method(console, "warn", () => {});
  for (const failure of [
    () => { throw new Error("dettaglio interno riservato"); },
    () => geminiResponse("risposta non JSON"),
  ]) {
    provider.mock.mockImplementation(failure);
    const failed = await send();
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), { message: "Non è stato possibile analizzare il pensiero. Riprova." });
  }
});
