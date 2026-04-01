import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function getSettingsRequest() {
  const response = await apiClient.get("/settings");
  return unwrapResponse(response);
}

export async function updateSettingsRequest(payload) {
  const response = await apiClient.put("/settings", payload);
  return unwrapResponse(response);
}
