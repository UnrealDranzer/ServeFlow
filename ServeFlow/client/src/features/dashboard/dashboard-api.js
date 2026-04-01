import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function getDashboardSummaryRequest() {
  const response = await apiClient.get("/dashboard/summary");
  return unwrapResponse(response);
}

export async function getRecentOrdersRequest(limit = 10) {
  const response = await apiClient.get("/dashboard/recent-orders", {
    params: {
      limit
    }
  });

  return unwrapResponse(response);
}
