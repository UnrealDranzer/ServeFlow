import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res, next) {
      next(ApiError.tooManyRequests(message));
    }
  });
}

export const apiLimiter = createRateLimiter({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT_MAX,
  message: "Too many API requests. Please try again shortly."
});

export const authLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  message: "Too many authentication attempts. Please try again shortly."
});

export const publicOrderLimiter = createRateLimiter({
  windowMs: env.PUBLIC_ORDER_RATE_LIMIT_WINDOW_MS,
  max: env.PUBLIC_ORDER_RATE_LIMIT_MAX,
  message: "Too many order attempts from this client. Please try again shortly."
});
