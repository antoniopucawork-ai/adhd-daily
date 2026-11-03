const TOKEN_KEY = "adhdDailyToken";
let controller = new AbortController();

export function getSessionToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getSessionSignal() {
  return controller.signal;
}

// Ogni login o logout chiude le richieste della sessione precedente,
// anche quando due login ravvicinati restituiscono lo stesso JWT.
export function replaceSession(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);

  controller.abort();
  controller = new AbortController();
}
