const AUTH_SESSION_STORAGE_KEY = "serveflow.auth.session";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function persistAuthSession(payload) {
  if (!canUseStorage()) {
    return;
  }

  const snapshot = {
    accessToken: payload.accessToken || null,
    user: payload.user || null,
    business: payload.business || null,
    permissions: payload.permissions || null
  };

  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function readPersistedAuthSession() {
  if (!canUseStorage()) {
    return null;
  }

  const snapshot = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!snapshot) {
    return null;
  }

  try {
    const parsed = JSON.parse(snapshot);

    if (!parsed?.accessToken || !parsed?.user || !parsed?.business) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearPersistedAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
