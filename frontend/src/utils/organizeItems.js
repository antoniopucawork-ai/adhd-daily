/**
 * Restituisce gli elementi non completati.
 * La funzione resta disponibile per le altre
 * parti dell'applicazione che ne hanno bisogno.
 */
export function getOpenItems(items) {
  return items.filter((item) => item.status !== "DONE");
}

/**
 * Divide i pensieri nelle cinque categorie
 * della mappa Organizza.
 *
 * Non modifica gli elementi originali.
 * Non cambia la classificazione del Mind Engine.
 */
export function organizeItems(items) {
  const safeItems = Array.isArray(items) ? items : [];

  return {
    "da-fare": safeItems.filter((item) => item.type === "ACTION"),

    "in-programma": safeItems.filter((item) => item.type === "EVENT"),

    forse: safeItems.filter((item) => item.type === "INTENTION"),

    "da-ricordare": safeItems.filter((item) => item.type === "MEMORY"),

    "pensieri-liberi": safeItems.filter((item) => item.type === "THOUGHT"),
  };
}
