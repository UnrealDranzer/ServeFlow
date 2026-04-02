import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  CLIENT_ORIGINS: z.string().min(1).default("http://localhost:5173"),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:5173"),
  ACCESS_TOKEN_SECRET: z.string().min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters."),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(2).default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  COOKIE_DOMAIN: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  REQUEST_BODY_LIMIT: z.string().min(2).default("2mb"),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
  PUBLIC_ORDER_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  PUBLIC_ORDER_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Environment validation failed.");
}

export const env = {
  ...parsedEnv.data,
  COOKIE_DOMAIN: parsedEnv.data.COOKIE_DOMAIN?.trim() || undefined
};
