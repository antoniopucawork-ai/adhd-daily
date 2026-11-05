import { isValidDate } from "./dateValidation.js";

export const ITEM_TYPES = ["ACTION", "EVENT", "MEMORY", "INTENTION", "THOUGHT"];
export const ITEM_STATUSES = ["TODO", "DONE"];
export const MAX_TEXT_LENGTH = 10000;
export const MAX_ITEMS = 20;
export const MAX_TITLE_LENGTH = 200;

export function isValidOriginalText(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_TEXT_LENGTH;
}

export function isValidTitle(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_TITLE_LENGTH;
}

export function isNullableDate(value) {
  return value === null || isValidDate(value);
}

export function isNullableTime(value) {
  return value === null || (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}
