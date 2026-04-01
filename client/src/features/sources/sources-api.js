import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function getOrderSourcesRequest() {
  const response = await apiClient.get("/order-sources");
  return unwrapResponse(response);
}

export async function createOrderSourceRequest(payload) {
  const response = await apiClient.post("/order-sources", payload);
  return unwrapResponse(response);
}

export async function updateOrderSourceRequest(sourceId, payload) {
  const response = await apiClient.put(`/order-sources/${sourceId}`, payload);
  return unwrapResponse(response);
}

export async function deleteOrderSourceRequest(sourceId) {
  const response = await apiClient.delete(`/order-sources/${sourceId}`);
  return unwrapResponse(response);
}

export async function getOrderSourceQrRequest(sourceId) {
  const response = await apiClient.get(`/order-sources/${sourceId}/qr`);
  return unwrapResponse(response);
}
