import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function loginRequest(credentials) {
  const response = await apiClient.post("/auth/login", credentials);
  return unwrapResponse(response);
}

export async function registerRequest(payload) {
  const response = await apiClient.post("/auth/register", payload);
  return unwrapResponse(response);
}

export async function refreshSessionRequest() {
  const response = await apiClient.post("/auth/refresh");
  return unwrapResponse(response);
}

export async function getCurrentUserRequest() {
  const response = await apiClient.get("/auth/me");
  return unwrapResponse(response);
}

export async function logoutRequest() {
  const response = await apiClient.post("/auth/logout");
  return unwrapResponse(response);
}
