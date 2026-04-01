import { env } from "./env.js";

const allowedOrigins = new Set(
  env.CLIENT_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error("Origin not allowed by CORS.");
    error.statusCode = 403;
    error.code = "CORS_ORIGIN_DENIED";
    callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-ServeFlow-CSRF"],
  exposedHeaders: ["X-Request-Id"],
  optionsSuccessStatus: 204
};
