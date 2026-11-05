export const MAX_TEXT_LENGTH = 10000;
export const MAX_ITEMS = 20;
export const MAX_TITLE_LENGTH = 200;

export const TYPE_LABELS = {
  ACTION: "Da fare",
  EVENT: "In programma",
  INTENTION: "Forse",
  MEMORY: "Da ricordare",
  THOUGHT: "Pensieri liberi",
};

export function isValidTitle(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_TITLE_LENGTH;
}
