import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

function buildErrorResponse({ error, req }) {
  return {
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred.",
      requestId: req.requestId,
      details: error.details
    }
  };
}

export function errorHandler(error, req, res, next) {
  let normalizedError = error;

  if (error instanceof ZodError) {
    normalizedError = ApiError.badRequest("Validation failed.", error.flatten());
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      normalizedError = ApiError.conflict("A record with the same unique value already exists.", {
        target: error.meta?.target
      });
    } else if (error.code === "P2025") {
      normalizedError = ApiError.notFound("Requested record was not found.");
    } else {
      normalizedError = ApiError.internal("Database operation failed.");
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    normalizedError = ApiError.badRequest("Invalid database input.");
  } else if (typeof error?.statusCode === "number") {
    normalizedError = new ApiError(
      error.statusCode,
      error.code || "REQUEST_ERROR",
      error.message || "Request failed.",
      error.details
    );
  } else if (!(error instanceof ApiError)) {
    normalizedError = ApiError.internal("Internal server error.");
  }

  const statusCode = normalizedError.statusCode || 500;

  req.log?.error(
    {
      err: error,
      requestId: req.requestId,
      statusCode
    },
    "Request failed."
  );

  const response = buildErrorResponse({
    error: normalizedError,
    req
  });

  if (env.NODE_ENV === "production" && statusCode >= 500) {
    response.error.details = undefined;
  }

  res.status(statusCode).json(response);
}
