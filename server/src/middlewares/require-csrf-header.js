import { ApiError } from "../utils/api-error.js";

export function requireCsrfHeader(req, res, next) {
  const csrfHeader = req.get("x-serveflow-csrf");

  if (csrfHeader !== "1") {
    next(ApiError.forbidden("Missing required CSRF header."));
    return;
  }

  next();
}
