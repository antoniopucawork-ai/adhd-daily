import { getSessionSignal, getSessionToken } from "./session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function apiRequest(endpoint, options = {}) {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const sessionSignal = token ? getSessionSignal() : null;
  if (token) {
    if (token !== getSessionToken()) {
      throw new DOMException("Sessione cambiata", "AbortError");
    }
    fetchOptions.signal = fetchOptions.signal
      ? AbortSignal.any([sessionSignal, fetchOptions.signal])
      : sessionSignal;
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json().catch(() => null);

  sessionSignal?.throwIfAborted();

  if (!response.ok) {
    if (token && response.status === 401) {
      window.dispatchEvent(new Event("adhd:session-expired"));
    }
    const error = new Error(data?.message || "Si è verificato un errore");
    error.status = response.status;
    throw error;
  }

  return data;
}
