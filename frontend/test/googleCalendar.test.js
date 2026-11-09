import test from "node:test";
import assert from "node:assert/strict";

import { getGoogleCalendarUrl } from "../src/utils/googleCalendar.js";

const evento = {
  type: "EVENT",
  title: "Appuntamento in studio",
  date: "2026-11-09",
  time: "16:00",
  uncertain: false,
};

test("esporta correttamente un evento confermato", () => {
  const url = new URL(getGoogleCalendarUrl(evento));

  assert.equal(url.hostname, "calendar.google.com");
  assert.equal(url.searchParams.get("text"), evento.title);
  assert.equal(
    url.searchParams.get("dates"),
    "20261109T160000/20261109T170000",
  );
  assert.equal(url.searchParams.get("ctz"), "Europe/Rome");
});

test("non esporta un evento incerto", () => {
  const risultato = getGoogleCalendarUrl({
    ...evento,
    uncertain: true,
  });

  assert.equal(risultato, null);
});

test("non esporta un'intenzione", () => {
  const risultato = getGoogleCalendarUrl({
    ...evento,
    type: "INTENTION",
  });

  assert.equal(risultato, null);
});

test("gestisce un evento che supera la mezzanotte", () => {
  const url = new URL(
    getGoogleCalendarUrl({
      ...evento,
      time: "23:30",
    }),
  );

  assert.equal(
    url.searchParams.get("dates"),
    "20261109T233000/20261110T003000",
  );
});
