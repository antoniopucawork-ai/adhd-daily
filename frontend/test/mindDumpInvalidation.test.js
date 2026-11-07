import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { act, createElement as h, useEffect } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Window } from "happy-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

let server, browser, createRoot, root, router;
let AppLayout, ProtectedRoute, ArchivePage, MindDumpPage, AuthContext;
let useMindDumps, useMindDumpItemActions, useMindDumpInvalidation;
let replaceSession, getSessionSignal;
const previousGlobals = new Map();
const snapshots = new Map();
const dumpId = "aaaaaaaaaaaaaaaaaaaaaaaa";
const itemId = "bbbbbbbbbbbbbbbbbbbbbbbb";
const item = { _id: itemId, type: "ACTION", title: "Pensiero A", status: "TODO", uncertain: false };
const dump = { _id: dumpId, originalText: "Pensiero A", items: [item] };

before(async () => {
  browser = new Window({ url: "http://localhost/" });
  for (const [name, value] of Object.entries({
    window: browser,
    document: browser.document,
    localStorage: browser.localStorage,
    sessionStorage: browser.sessionStorage,
    Event: browser.Event,
    CustomEvent: browser.CustomEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previousGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  ({ createRoot } = await import("react-dom/client"));
  server = await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)),
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    logLevel: "silent",
  });
  ({ default: AppLayout } = await server.ssrLoadModule("/src/layouts/AppLayout.jsx"));
  ({ default: ProtectedRoute } = await server.ssrLoadModule("/src/routes/ProtectedRoute.jsx"));
  ({ default: ArchivePage } = await server.ssrLoadModule("/src/pages/ArchivePage.jsx"));
  ({ default: MindDumpPage } = await server.ssrLoadModule("/src/pages/MindDumpPage.jsx"));
  ({ AuthContext } = await server.ssrLoadModule("/src/context/authStore.js"));
  ({ useMindDumps } = await server.ssrLoadModule("/src/hooks/useMindDumps.js"));
  ({ useMindDumpItemActions } = await server.ssrLoadModule("/src/hooks/useMindDumpItemActions.js"));
  ({ useMindDumpInvalidation } = await server.ssrLoadModule("/src/context/mindDumpInvalidationStore.js"));
  ({ replaceSession, getSessionSignal } = await server.ssrLoadModule("/src/services/session.js"));
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  root = null;
  router?.dispose();
  replaceSession?.(null);
  browser.document.body.innerHTML = "";
  browser.localStorage.clear();
  snapshots.clear();
});

after(async () => {
  await server?.close();
  await browser?.happyDOM.close();
  for (const [name, descriptor] of previousGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function Reader({ name }) {
  const data = useMindDumps();
  const actions = useMindDumpItemActions({ items: data.items, reload: data.reload });
  const { revision } = useMindDumpInvalidation();
  useEffect(() => { snapshots.set(name, { ...data, ...actions, revision }); });
  useEffect(() => () => { snapshots.delete(name); }, [name]);
  return h("output", { "data-page": name }, JSON.stringify({ items: data.items, revision }));
}

function Origin() { return h(Reader, { name: "origin" }); }
function Destination() { return h(Reader, { name: "destination" }); }

async function renderAccount(token = "token-A", userId = "utente-A") {
  await act(async () => {
    root.render(h(AuthContext.Provider, {
      value: { token, user: { id: userId }, isAuthenticated: true, isLoading: false },
    }, h(RouterProvider, { router })));
  });
}

async function mount(OriginComponent = Origin) {
  replaceSession("token-A");
  const container = browser.document.createElement("div");
  browser.document.body.append(container);
  root = createRoot(container);
  router = createMemoryRouter([{
    element: h(ProtectedRoute),
    children: [{ element: h(AppLayout), children: [
      { path: "/", element: h(OriginComponent) },
      { path: "/organizza", element: h(Destination) },
    ] }],
  }], { initialEntries: ["/"] });
  await renderAccount();
}

async function navigate() {
  await act(async () => { await router.navigate("/organizza"); });
  assert.equal(browser.document.querySelector('[data-page="origin"]'), null);
}

async function click(selector) {
  const button = browser.document.querySelector(selector);
  assert.ok(button, selector);
  assert.equal(button.disabled, false, selector);
  await act(async () => button.click());
}

async function changeValue(selector, value) {
  const input = browser.document.querySelector(selector);
  assert.ok(input, selector);
  await act(async () => {
    Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new browser.Event("input", { bubbles: true }));
  });
}

function mockApi(context, { empty = false, fail = false, unconfirmed = false, deferAnalysis = false, failAnalysis = false } = {}) {
  const pendingMutation = deferred();
  const pendingAnalysis = deferred();
  let dumps = empty ? [] : structuredClone([dump]);
  let reads = 0;
  let holdRead = null;
  context.mock.method(globalThis, "fetch", async (url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method ?? "GET";
    if (method === "GET") {
      reads++;
      const result = options.headers.get("Authorization") === "Bearer token-B"
        ? [{ ...dump, items: [{ ...item, title: "Privato B" }] }]
        : structuredClone(dumps);
      if (holdRead) {
        const held = holdRead;
        holdRead = null;
        await held.promise;
      }
      return Response.json(result);
    }
    if (path.endsWith("/analyze")) {
      if (deferAnalysis) await pendingAnalysis.promise;
      return failAnalysis
        ? Response.json({ message: "Analisi non disponibile" }, { status: 502 })
        : Response.json({ items: [item] });
    }
    await pendingMutation.promise;
    if (fail) return Response.json({ message: "Errore simulato" }, { status: 500 });
    if (unconfirmed) return Response.json({});
    if (method === "PATCH") {
      Object.assign(dumps[0].items[0], JSON.parse(options.body));
      return Response.json({ item: dumps[0].items[0] });
    }
    if (method === "POST") {
      dumps = structuredClone([dump]);
      return Response.json({ mindDump: dumps[0] });
    }
    if (path.includes("/items/")) {
      dumps[0].items = [];
      return Response.json({ removedDump: false, remainingItems: 0 });
    }
    dumps = [];
    return Response.json({ message: "Eliminato", deletedCount: 1 });
  });
  return {
    get reads() { return reads; },
    release: pendingMutation.resolve,
    releaseAnalysis: pendingAnalysis.resolve,
    holdNextRead() { holdRead = deferred(); return holdRead; },
  };
}

test("il completamento termina dopo lo smontaggio e aggiorna la nuova pagina che aveva già letto TODO", async (context) => {
  const api = mockApi(context);
  await mount();
  let completion;
  await act(async () => { completion = snapshots.get("origin").completeItem(itemId); });
  await navigate();
  assert.equal(snapshots.has("origin"), false);
  assert.equal(snapshots.get("destination").items[0].status, "TODO");
  assert.equal(api.reads, 2);

  await act(async () => { api.release(); assert.equal(await completion, true); });
  assert.equal(api.reads, 3);
  assert.equal(snapshots.get("destination").revision, 1);
  assert.equal(snapshots.get("destination").items[0].status, "DONE");
});

for (const operation of ["modifica", "elimina elemento", "elimina dump", "elimina tutto"]) {
  test(`Archivio: ${operation} propaga reload dopo lo smontaggio`, async (context) => {
    const api = mockApi(context);
    await mount(ArchivePage);
    if (operation === "modifica") {
      await click(".archive-page__edit-button");
      await changeValue('input[name="title"]', "Titolo corretto");
      await act(async () => browser.document.querySelector(".mind-edit__form")
        .dispatchEvent(new browser.Event("submit", { bubbles: true, cancelable: true })));
    } else if (operation === "elimina tutto") {
      await click(".delete-all__trigger");
      await changeValue("#delete-all-confirmation", "ELIMINA TUTTO");
      await click(".delete-all__confirm");
    } else {
      const buttons = browser.document.querySelectorAll(".archive-page__actions .archive-page__delete");
      await act(async () => buttons[operation === "elimina elemento" ? 0 : 1].click());
      await click(".archive-page__confirm-delete");
    }
    await navigate();
    assert.equal(browser.document.querySelector(".archive-page"), null);
    assert.equal(snapshots.get("destination").items[0].title, "Pensiero A");
    assert.equal(api.reads, 2);

    await act(async () => api.release());
    assert.equal(api.reads, 3);
    assert.equal(snapshots.get("destination").revision, 1);
    if (operation === "modifica") {
      assert.equal(snapshots.get("destination").items[0].title, "Titolo corretto");
    } else {
      assert.equal(snapshots.get("destination").items.length, 0);
    }
  });
}

for (const unconfirmed of [false, true]) {
  test(`creazione dopo cambio pagina: ${unconfirmed ? "risposta non confermata non invalida" : "POST confermato aggiorna i dati"}`, async (context) => {
    const api = mockApi(context, { empty: true, unconfirmed });
    browser.localStorage.setItem("adhdDailyDraft:utente-A", "Pensiero A");
    await mount(MindDumpPage);
    await act(async () => browser.document.querySelector(".mind-dump-page__form")
      .dispatchEvent(new browser.Event("submit", { bubbles: true, cancelable: true })));
    await click(".mind-result__confirm");
    await navigate();
    assert.equal(browser.document.querySelector(".mind-dump-page"), null);
    assert.deepEqual(snapshots.get("destination").items, []);

    await act(async () => api.release());
    assert.equal(snapshots.get("destination").revision, unconfirmed ? 0 : 1);
    assert.equal(api.reads, unconfirmed ? 1 : 2);
    assert.equal(snapshots.get("destination").items.length, unconfirmed ? 0 : 1);
  });
}

test("una risposta GET obsoleta non sovrascrive i dati successivi all'invalidazione", async (context) => {
  const api = mockApi(context);
  await mount();
  let completion;
  await act(async () => { completion = snapshots.get("origin").completeItem(itemId); });
  const staleRead = api.holdNextRead();
  await navigate();
  assert.equal(snapshots.get("destination").isLoading, true);
  await act(async () => { api.release(); await completion; });
  assert.equal(snapshots.get("destination").items[0].status, "DONE");
  await act(async () => staleRead.resolve());
  assert.equal(snapshots.get("destination").items[0].status, "DONE");
});

test("una mutazione fallita dopo il cambio pagina non incrementa la revisione", async (context) => {
  const api = mockApi(context, { fail: true });
  await mount();
  let completion;
  await act(async () => { completion = snapshots.get("origin").completeItem(itemId); });
  await navigate();
  await act(async () => { api.release(); assert.equal(await completion, false); });
  assert.equal(api.reads, 2);
  assert.equal(snapshots.get("destination").revision, 0);
});

test("richieste e callback dell'account A non invalidano né mostrano dati nell'account B", async (context) => {
  const api = mockApi(context);
  await mount();
  const oldReload = snapshots.get("origin").reload;
  const oldSignal = getSessionSignal();
  let completion;
  await act(async () => { completion = snapshots.get("origin").completeItem(itemId); });
  await navigate();
  replaceSession("token-B");
  await renderAccount("token-B", "utente-B");
  assert.equal(snapshots.get("destination").revision, 0);
  assert.equal(snapshots.get("destination").items[0].title, "Privato B");
  const readsBefore = api.reads;

  await act(async () => {
    oldReload();
    browser.dispatchEvent(new browser.CustomEvent("adhd:mind-dump-created", {
      detail: { token: "token-A", sessionSignal: oldSignal },
    }));
    api.release();
    assert.equal(await completion, false);
  });
  assert.equal(api.reads, readsBefore);
  assert.equal(snapshots.get("destination").revision, 0);
  assert.equal(snapshots.get("destination").items[0].title, "Privato B");
});

test("una sessione sostituita con lo stesso JWT non può usare il vecchio reload", async (context) => {
  const api = mockApi(context);
  await mount();
  const oldReload = snapshots.get("origin").reload;
  const oldSignal = getSessionSignal();
  replaceSession("token-A");
  await renderAccount();
  const readsBefore = api.reads;
  await act(async () => {
    oldReload();
    browser.dispatchEvent(new browser.CustomEvent("adhd:mind-dump-created", {
      detail: { token: "token-A", sessionSignal: oldSignal },
    }));
  });
  assert.equal(api.reads, readsBefore);
  assert.equal(snapshots.get("origin").revision, 0);
  await act(async () => snapshots.get("origin").reload());
  assert.equal(snapshots.get("origin").revision, 1);
  assert.equal(api.reads, readsBefore + 1);
});


async function startAnalysis() {
  browser.localStorage.setItem("adhdDailyDraft:utente-A", "Pensiero A");
  await mount(MindDumpPage);
  await act(async () => browser.document.querySelector(".mind-dump-page__form")
    .dispatchEvent(new browser.Event("submit", { bubbles: true, cancelable: true })));
}

test("analisi rapida: mostra subito il risultato senza attesa visiva o ritardi artificiali", async (context) => {
  mockApi(context);
  context.mock.timers.enable({ apis: ["setTimeout"] });
  await startAnalysis();
  assert.ok(browser.document.querySelector(".mind-result"));
  assert.equal(browser.document.querySelector(".mind-dump-page__analysis"), null);
  await act(async () => context.mock.timers.tick(500));
  assert.equal(browser.document.querySelector(".mind-dump-page__analysis"), null);
});

test("analisi lenta: il messaggio statico compare dopo 400 ms e lascia intatta la bozza", async (context) => {
  const api = mockApi(context, { deferAnalysis: true });
  context.mock.timers.enable({ apis: ["setTimeout"] });
  await startAnalysis();
  await act(async () => context.mock.timers.tick(399));
  assert.equal(browser.document.querySelector(".mind-dump-page__analysis"), null);
  await act(async () => context.mock.timers.tick(1));
  const status = browser.document.querySelector('.mind-dump-page__analysis[role="status"]');
  assert.equal(status.textContent, "Sto dando forma ai tuoi pensieri");
  assert.equal(status.querySelector("canvas"), null);
  assert.equal(browser.localStorage.getItem("adhdDailyDraft:utente-A"), "Pensiero A");
  await act(async () => api.releaseAnalysis());
  assert.equal(browser.document.querySelector(".mind-dump-page__analysis"), null);
  assert.ok(browser.document.querySelector(".mind-result"));
  assert.equal(browser.localStorage.getItem("adhdDailyDraft:utente-A"), "Pensiero A");
});

test("il cambio pagina prima della soglia annulla l'attesa visiva", async (context) => {
  const api = mockApi(context, { deferAnalysis: true });
  context.mock.timers.enable({ apis: ["setTimeout"] });
  await startAnalysis();
  await navigate();
  await act(async () => context.mock.timers.tick(500));
  assert.equal(browser.document.querySelector(".mind-dump-page__analysis"), null);
  await act(async () => api.releaseAnalysis());
  assert.ok(browser.document.querySelector('[data-page="destination"]'));
});

test("un errore di analisi rimuove il messaggio di attesa e conserva il testo per riprovare", async (context) => {
  const api = mockApi(context, { deferAnalysis: true, failAnalysis: true });
  context.mock.timers.enable({ apis: ["setTimeout"] });
  await startAnalysis();
  await act(async () => context.mock.timers.tick(400));
  assert.ok(browser.document.querySelector(".mind-dump-page__analysis"));
  await act(async () => api.releaseAnalysis());
  assert.equal(browser.document.querySelector(".mind-dump-page__analysis"), null);
  assert.match(browser.document.querySelector('[role="alert"]').textContent, /Analisi non disponibile/);
  assert.equal(browser.document.querySelector("textarea").value, "Pensiero A");
  assert.equal(browser.document.querySelector("textarea").disabled, false);
  assert.equal(browser.localStorage.getItem("adhdDailyDraft:utente-A"), "Pensiero A");
});
