import assert from "node:assert/strict";
import test from "node:test";
import MindDump from "../models/MindDump.js";
import { updateMindDumpItem } from "../controllers/mindDumpCrudController.js";

const dumpId = "aaaaaaaaaaaaaaaaaaaaaaaa";
const itemId = "bbbbbbbbbbbbbbbbbbbbbbbb";
const userId = "cccccccccccccccccccccccc";

async function patch(body) {
  const response = {
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };

  await updateMindDumpItem({ params: { dumpId, itemId }, userId, body }, response);
  return response;
}

test("completa solo l'azione confermata e appartenente all'utente", async (context) => {
  const query = context.mock.method(MindDump, "findOneAndUpdate", async () => ({
    items: { id: () => ({ _id: itemId, status: "DONE" }) },
  }));
  const response = await patch({ status: "DONE" });
  assert.equal(response.statusCode, 200);
  const [filter, update, options] = query.mock.calls[0].arguments;
  assert.equal(filter._id, dumpId);
  assert.equal(filter.user, userId);
  assert.equal(String(filter.items.$elemMatch._id), itemId);
  assert.equal(filter.items.$elemMatch.type, "ACTION");
  assert.deepEqual(filter.items.$elemMatch.uncertain, { $in: [null, false] });
  assert.deepEqual(update.$set, { "items.$.status": "DONE" });
  assert.equal(options.runValidators, true);
});

test("rifiuta una modifica che produce un completato incerto o di altra categoria", async (context) => {
  const query = context.mock.method(MindDump, "findOneAndUpdate", async () => null);
  assert.equal((await patch({ status: "DONE", uncertain: true })).statusCode, 400);
  assert.equal((await patch({ status: "DONE", type: "EVENT" })).statusCode, 400);
  assert.equal(query.mock.callCount(), 0);
});

test("distingue un elemento non completabile da uno inesistente o altrui", async (context) => {
  context.mock.method(MindDump, "findOneAndUpdate", async () => null);
  const exists = context.mock.method(MindDump, "exists", async () => ({ _id: dumpId }));
  assert.equal((await patch({ status: "DONE" })).statusCode, 409);
  assert.equal(exists.mock.calls[0].arguments[0].user, userId);
  exists.mock.mockImplementation(async () => null);
  assert.equal((await patch({ status: "DONE" })).statusCode, 404);
});

test("mantiene la modifica ordinaria di categoria", async (context) => {
  const query = context.mock.method(MindDump, "findOneAndUpdate", async () => ({
    items: { id: () => ({ _id: itemId, type: "EVENT" }) },
  }));
  assert.equal((await patch({ type: "EVENT" })).statusCode, 200);
  const [filter, update] = query.mock.calls[0].arguments;
  assert.deepEqual(filter.items.$elemMatch.status, { $ne: "DONE" });
  assert.deepEqual(update.$set, { "items.$.type": "EVENT" });
});

test("blocca modifiche incompatibili su elementi completati nella query atomica", async (context) => {
  const query = context.mock.method(MindDump, "findOneAndUpdate", async () => null);
  const exists = context.mock.method(MindDump, "exists", async () => ({ _id: dumpId }));

  for (const changes of [{ type: "EVENT" }, { uncertain: true }]) {
    assert.equal((await patch(changes)).statusCode, 409);
    const [filter] = query.mock.calls.at(-1).arguments;
    assert.equal(filter.user, userId);
    assert.equal(String(filter.items.$elemMatch._id), itemId);
    assert.deepEqual(filter.items.$elemMatch.status, { $ne: "DONE" });
  }

  exists.mock.mockImplementation(async () => null);
  assert.equal((await patch({ uncertain: true })).statusCode, 404);
});

test("consente modifiche compatibili e cambi di categoria con riapertura esplicita", async (context) => {
  const query = context.mock.method(MindDump, "findOneAndUpdate", async () => ({
    items: { id: () => ({ _id: itemId }) },
  }));

  for (const changes of [{ title: "Titolo corretto" }, { status: "TODO", type: "EVENT" }]) {
    assert.equal((await patch(changes)).statusCode, 200);
    const [filter] = query.mock.calls.at(-1).arguments;
    assert.deepEqual(Object.keys(filter.items.$elemMatch), ["_id"]);
  }
});
