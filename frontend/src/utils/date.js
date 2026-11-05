const romeDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getTodayDate(now = new Date()) {
  const parts = romeDate.formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
}

export function getTomorrowDate(now = new Date()) {
  const date = new Date(`${getTodayDate(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function parseCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}
