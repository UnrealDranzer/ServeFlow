import { QueryClient } from "@tanstack/react-query";

function shouldRetryRequest(failureCount, error) {
  const status = error?.response?.status;

  if ([400, 401, 403, 404, 409, 422].includes(status)) {
    return false;
  }

  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryRequest,
      refetchOnWindowFocus: false,
      staleTime: 30_000
    },
    mutations: {
      retry: false
    }
  }
});
