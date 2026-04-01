const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL in the client environment.");
}

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/+$/, "")
};
