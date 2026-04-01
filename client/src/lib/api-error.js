import axios from "axios";

export function getApiErrorMessage(error, fallbackMessage = "Something went wrong. Please try again.") {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
