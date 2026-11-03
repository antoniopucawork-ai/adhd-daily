export function getOpenItems(items) {
  return items.filter((item) => item.status !== "DONE");
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
