export class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication required.", details) {
    return new ApiError(401, "UNAUTHORIZED", message, details);
  }

  static forbidden(message = "Forbidden.", details) {
    return new ApiError(403, "FORBIDDEN", message, details);
  }

  static notFound(message = "Resource not found.", details) {
    return new ApiError(404, "NOT_FOUND", message, details);
  }

  static conflict(message = "Resource conflict.", details) {
    return new ApiError(409, "CONFLICT", message, details);
  }

  static tooManyRequests(message = "Too many requests.", details) {
    return new ApiError(429, "TOO_MANY_REQUESTS", message, details);
  }

  static internal(message = "Internal server error.", details) {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message, details);
  }
}
