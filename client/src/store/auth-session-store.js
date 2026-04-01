export const initialAuthSessionState = Object.freeze({
  status: "loading",
  isBootstrapped: false,
  accessToken: null,
  user: null,
  business: null,
  permissions: null
});

let state = { ...initialAuthSessionState };
const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const authSessionStore = {
  getState() {
    return state;
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setState(nextState) {
    state = typeof nextState === "function" ? nextState(state) : nextState;
    emitChange();
  }
};

export function setAuthLoadingState() {
  authSessionStore.setState((currentState) => ({
    ...currentState,
    status: "loading"
  }));
}

export function setAuthenticatedSession(payload) {
  authSessionStore.setState((currentState) => ({
    status: "authenticated",
    isBootstrapped: true,
    accessToken: payload.accessToken ?? currentState.accessToken,
    user: payload.user,
    business: payload.business,
    permissions: payload.permissions
  }));
}

export function clearAuthenticatedSession() {
  authSessionStore.setState({
    ...initialAuthSessionState,
    status: "anonymous",
    isBootstrapped: true
  });
}
