import { parseCalendarDate } from "./date.js";

export function getGoogleCalendarUrl(item) {
  // Esportiamo solo eventi già salvati e affidabili.
  if (item?.type !== "EVENT" || item.uncertain) {
    return null;
  }

  const date = parseCalendarDate(item.date);

  if (!date || !item.title?.trim()) {
    return null;
  }

  // Senza orario non inventiamo l'ora dell'evento.
  if (
    typeof item.time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)
  ) {
    return null;
  }

  const [hours, minutes] = item.time.split(":").map(Number);

  // Durata proposta: 60 minuti, modificabile su Google.
  const endDate = new Date(
    date.getTime() + (hours * 60 + minutes + 60) * 60_000,
  );

  const start = `${item.date.replaceAll("-", "")}T${item.time.replace(":", "")}00`;

  const end = endDate.toISOString().slice(0, 19).replace(/[-:]/g, "");

  const url = new URL("https://calendar.google.com/calendar/render");

  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", item.title);
  url.searchParams.set("dates", `${start}/${end}`);
  url.searchParams.set("ctz", "Europe/Rome");

  return url.toString();
}
