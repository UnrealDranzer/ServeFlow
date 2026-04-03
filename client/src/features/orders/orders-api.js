import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function getOrdersRequest(params) {
  const response = await apiClient.get("/orders", {
    params
  });

  return unwrapResponse(response);
}

export async function getOrderDetailsRequest(orderId) {
  const response = await apiClient.get(`/orders/${orderId}`);
  return unwrapResponse(response);
}

export async function createManualOrderRequest(payload) {
  const response = await apiClient.post("/orders/manual", payload);
  return unwrapResponse(response);
}

export async function updateOrderStatusRequest(orderId, status) {
  const response = await apiClient.patch(`/orders/${orderId}/status`, {
    status
  });

  return unwrapResponse(response);
}

export async function editOrderItemsRequest(orderId, payload) {
  const response = await apiClient.put(`/orders/${orderId}/items`, payload);
  return unwrapResponse(response);
}
