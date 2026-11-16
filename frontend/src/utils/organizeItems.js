export function getOpenItems(items) {
  return items.filter((item) => item.status !== "DONE");
}

export function getCompletedItems(items) {
  return items.filter((item) => item.status === "DONE");
}

export function organizeItems(items) {
  const openItems = getOpenItems(items);

  return {
    "da-fare": openItems.filter((item) => item.type === "ACTION"),

    "in-programma": openItems.filter((item) => item.type === "EVENT"),

    forse: openItems.filter((item) => item.type === "INTENTION"),

    "da-ricordare": openItems.filter((item) => item.type === "MEMORY"),

    "pensieri-liberi": openItems.filter((item) => item.type === "THOUGHT"),

    "da-verificare": openItems.filter((item) => item.uncertain === true),
  };
}

export function canCompleteAction(item) {
  return item?.type === "ACTION" && !item.uncertain && item.status !== "DONE";
}

export function getTodayItems(items, today) {
  return getOpenItems(items).filter(
    (item) =>
      item.date === today && (item.type === "ACTION" || item.type === "EVENT"),
  );
}

export function getNextAction(items, today) {
  const actions = items.filter(canCompleteAction);
  // Ordiniamo una nuova lista: prima la data, poi l'ora se presente.
  const datedActions = actions.filter((item) => item.date).sort((a, b) =>
    a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99"),
  );
  return (
    datedActions.find((item) => item.date === today) ??
    datedActions.find((item) => item.date < today) ??
    actions.find((item) => !item.date) ??
    datedActions.find((item) => item.date > today)
  );
}
export function getOverdueActions(items, today) {
  return items.filter(
    (item) =>
      canCompleteAction(item) &&
      typeof item.date === "string" &&
      item.date < today,
  );
}
