// Restituisce gli elementi ancora aperti.
export function getOpenItems(items) {
  return items.filter((item) => item.status !== "DONE");
}

// Divide gli elementi nelle categorie di Organizza.
export function organizeItems(items) {
  const openItems = getOpenItems(items);

  return {
    "da-fare": openItems.filter(
      (item) => item.type === "ACTION" && !item.uncertain,
    ),

    eventi: openItems.filter(
      (item) => item.type === "EVENT" && !item.uncertain,
    ),

    "da-verificare": openItems.filter((item) => item.uncertain === true),
  };
}
