import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function getPublicMenuRequest(businessSlug, sourceSlug) {
  const response = await apiClient.get(`/public/${businessSlug}/${sourceSlug}/menu`);
  return unwrapResponse(response);
}

export async function createPublicOrderRequest(businessSlug, sourceSlug, payload) {
  const response = await apiClient.post(`/public/${businessSlug}/${sourceSlug}/orders`, payload);
  return unwrapResponse(response);
}
