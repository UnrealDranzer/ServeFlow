import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function getMenuItemsRequest(params) {
  const response = await apiClient.get("/menu-items", {
    params
  });

  return unwrapResponse(response);
}

export async function createMenuItemRequest(payload) {
  const response = await apiClient.post("/menu-items", payload);
  return unwrapResponse(response);
}

export async function updateMenuItemRequest(menuItemId, payload) {
  const response = await apiClient.put(`/menu-items/${menuItemId}`, payload);
  return unwrapResponse(response);
}

export async function patchMenuItemAvailabilityRequest(menuItemId, isAvailable) {
  const response = await apiClient.patch(`/menu-items/${menuItemId}/availability`, {
    isAvailable
  });

  return unwrapResponse(response);
}

export async function deleteMenuItemRequest(menuItemId) {
  const response = await apiClient.delete(`/menu-items/${menuItemId}`);
  return unwrapResponse(response);
}
