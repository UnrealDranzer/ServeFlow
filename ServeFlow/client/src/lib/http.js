import axios from "axios";
import { env } from "@/lib/env";
import { authSessionStore } from "@/store/auth-session-store";

let refreshHandler = null;
let authFailureHandler = null;
let refreshPromise = null;

function isRefreshSensitiveRequest(url = "") {
  return url.includes("/auth/login") || url.includes("/auth/refresh");
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000
});

apiClient.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  const { accessToken } = authSessionStore.getState();

  nextConfig.headers = nextConfig.headers || {};

  if (accessToken) {
    nextConfig.headers.Authorization = `Bearer ${accessToken}`;
  }

  const method = nextConfig.method?.toLowerCase();

  if (method && !["get", "head", "options"].includes(method)) {
    nextConfig.headers["X-ServeFlow-CSRF"] = "1";
  }

  return nextConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (
      status !== 401 ||
      originalRequest._retry ||
      isRefreshSensitiveRequest(originalRequest.url) ||
      !refreshHandler
    ) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshHandler().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return apiClient(originalRequest);
    } catch (refreshError) {
      authFailureHandler?.();
      throw refreshError;
    }
  }
);

export function registerAuthTransportHandlers({ onRefresh, onAuthFailure }) {
  refreshHandler = onRefresh;
  authFailureHandler = onAuthFailure;

  return () => {
    if (refreshHandler === onRefresh) {
      refreshHandler = null;
    }

    if (authFailureHandler === onAuthFailure) {
      authFailureHandler = null;
    }
  };
}
