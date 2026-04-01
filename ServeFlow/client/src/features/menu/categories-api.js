import { apiClient } from "@/lib/http";

function unwrapResponse(response) {
  return response.data.data;
}

export async function getCategoriesRequest(activeOnly = false) {
  const response = await apiClient.get("/categories", {
    params: {
      activeOnly
    }
  });

  return unwrapResponse(response);
}

export async function createCategoryRequest(payload) {
  const response = await apiClient.post("/categories", payload);
  return unwrapResponse(response);
}

export async function updateCategoryRequest(categoryId, payload) {
  const response = await apiClient.put(`/categories/${categoryId}`, payload);
  return unwrapResponse(response);
}

export async function deleteCategoryRequest(categoryId) {
  const response = await apiClient.delete(`/categories/${categoryId}`);
  return unwrapResponse(response);
}
