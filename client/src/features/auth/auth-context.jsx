import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  authSessionStore,
  clearAuthenticatedSession,
  hydrateAuthSession,
  setAuthenticatedSession,
  setAuthLoadingState
} from "@/store/auth-session-store";
import {
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest
} from "@/features/auth/auth-api";
import {
  clearPersistedAuthSession,
  persistAuthSession,
  readPersistedAuthSession
} from "@/features/auth/auth-persistence";
import { registerAuthTransportHandlers } from "@/lib/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  async function refresh() {
    const payload = await refreshSessionRequest();
    setAuthenticatedSession(payload);
    persistAuthSession(payload);
    return payload;
  }

  async function login(credentials) {
    const payload = await loginRequest(credentials);
    setAuthenticatedSession(payload);
    persistAuthSession(payload);
    return payload;
  }

  function handleAuthFailure() {
    clearAuthenticatedSession();
    clearPersistedAuthSession();
    queryClient.clear();
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      handleAuthFailure();
    }
  }

  useEffect(() => {
    const unregisterAuthTransport = registerAuthTransportHandlers({
      onRefresh: refresh,
      onAuthFailure: handleAuthFailure
    });

    let isActive = true;

    async function bootstrapSession() {
      setAuthLoadingState();
      const persistedSession = readPersistedAuthSession();

      try {
        if (persistedSession?.accessToken) {
          hydrateAuthSession(persistedSession);
          try {
            const payload = await getCurrentUserRequest();
            setAuthenticatedSession(payload);
            persistAuthSession({
              ...persistedSession,
              ...payload,
              accessToken: authSessionStore.getState().accessToken || persistedSession.accessToken
            });
            return;
          } catch {
            await refresh();
            return;
          }
        }

        await refresh();
      } catch {
        if (isActive) {
          handleAuthFailure();
        }
      }
    }

    bootstrapSession();

    return () => {
      isActive = false;
      unregisterAuthTransport();
    };
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const actions = useContext(AuthContext);

  if (!actions) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  const session = useSyncExternalStore(
    authSessionStore.subscribe,
    authSessionStore.getState,
    authSessionStore.getState
  );

  return {
    ...session,
    ...actions,
    isAuthenticated: session.status === "authenticated"
  };
}
