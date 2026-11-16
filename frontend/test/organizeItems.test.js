import assert from "node:assert/strict";
import test from "node:test";
import { getTodayDate, getTomorrowDate } from "../src/utils/date.js";
import {
  canCompleteAction,
  getCompletedItems,
  getNextAction,
  getTodayItems,
  organizeItems,
  getOverdueActions,
} from "../src/utils/organizeItems.js";

const today = "2026-11-05";
const action = {
  type: "ACTION",
  status: "TODO",
  uncertain: false,
  date: today,
};

test("usa il giorno di Roma e calcola domani a cavallo dell'anno", () => {
  const instant = new Date("2026-12-31T23:30:00Z");
  assert.equal(getTodayDate(instant), "2027-01-01");
  assert.equal(getTomorrowDate(new Date("2026-12-31T18:00:00Z")), "2027-01-01");
  assert.equal(getTodayDate(new Date("2026-07-01T22:05:00Z")), "2026-07-02");
});

test("Oggi mostra azioni e appuntamenti del giorno senza includere i completati", () => {
  const event = { ...action, type: "EVENT" };
  const memory = { ...action, type: "MEMORY" };
  const intention = { ...action, type: "INTENTION", uncertain: true };
  const thought = { ...action, type: "THOUGHT" };
  const done = { ...action, status: "DONE" };
  assert.deepEqual(
    getTodayItems([event, memory, intention, thought, done, action], today),
    [event, action],
  );
  assert.deepEqual(getCompletedItems([action, done]), [done]);
  assert.deepEqual(
    organizeItems([memory, intention, thought, done, action])["da-verificare"],
    [intention],
  );
});

test("Prossimo passo preferisce oggi, arretrati, senza data e infine future", () => {
  const overdue = { ...action, date: "2026-11-04" };
  const undated = { ...action, date: null };
  const future = { ...action, date: "2026-11-06" };
  const futureEvent = { ...future, type: "EVENT" };
  const uncertain = { ...action, uncertain: true };
  const done = { ...action, status: "DONE" };

  assert.equal(getNextAction([undated, overdue, action], today), action);
  assert.equal(getNextAction([uncertain, undated, overdue], today), overdue);
  assert.equal(
    getNextAction([future, futureEvent, done, uncertain, undated], today),
    undated,
  );
  assert.equal(
    getNextAction([future, futureEvent, done, uncertain], today),
    future,
  );
  assert.deepEqual(organizeItems([overdue, undated, futureEvent])["da-fare"], [
    overdue,
    undated,
  ]);
  assert.deepEqual(organizeItems([futureEvent])["in-programma"], [futureEvent]);
});

test("solo le azioni aperte e confermate sono completabili", () => {
  assert.equal(canCompleteAction(action), true);
  assert.equal(canCompleteAction({ ...action, date: null }), true);
  assert.equal(canCompleteAction({ ...action, uncertain: true }), false);
  assert.equal(canCompleteAction({ ...action, status: "DONE" }), false);
  assert.equal(canCompleteAction({ ...action, type: "EVENT" }), false);
  assert.equal(canCompleteAction(undefined), false);
});
test("le azioni arretrate restano aperte e vengono individuate", () => {
  const overdue = { ...action, date: "2026-11-03" };
  const done = { ...overdue, status: "DONE" };
  const uncertain = { ...overdue, uncertain: true };
  const event = { ...overdue, type: "EVENT" };
  const undated = { ...action, date: null };
  const future = { ...action, date: "2026-11-06" };

  assert.deepEqual(
    getOverdueActions(
      [overdue, done, uncertain, event, undated, future, action],
      today,
    ),
    [overdue],
  );
});


test("Prossimo passo ordina le azioni datate senza modificare la lista ricevuta", () => {
  const later = { ...action, date: "2026-11-07", time: "08:00" };
  const afternoon = { ...action, date: "2026-11-06", time: "18:00" };
  const morning = { ...afternoon, time: "09:00" };
  const noTime = { ...afternoon, time: null };
  const items = [later, noTime, afternoon, morning];
  assert.equal(getNextAction(items, today), morning);
  assert.deepEqual(items, [later, noTime, afternoon, morning]);
  assert.equal(getNextAction([noTime, afternoon], today), afternoon);
  const oldest = { ...action, date: "2026-11-01" };
  const recent = { ...action, date: "2026-11-04" };
  assert.equal(getNextAction([recent, oldest], today), oldest);
  assert.equal(getNextAction([afternoon, morning], "2026-11-06"), morning);
});

test("Prossimo passo non propone eventi, intenzioni, azioni incerte o completate", () => {
  assert.equal(getNextAction([
    { ...action, type: "EVENT" },
    { ...action, type: "INTENTION" },
    { ...action, uncertain: true },
    { ...action, status: "DONE" },
  ], today), undefined);
  assert.equal(getNextAction([], today), undefined);
  const first = { ...action };
  const second = { ...action };
  assert.equal(getNextAction([first, second], today), first);
});
