import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { TOKEN_TYPES } from "./constants.js";

const ACCESS_TOKEN_AUDIENCE = "serveflow-admin";
const ACCESS_TOKEN_ISSUER = "serveflow-api";

export function generateAccessToken({ userId, businessId, role, sessionId }) {
  return jwt.sign(
    {
      businessId,
      role,
      sessionId,
      type: TOKEN_TYPES.ACCESS
    },
    env.ACCESS_TOKEN_SECRET,
    {
      subject: userId,
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
      audience: ACCESS_TOKEN_AUDIENCE,
      issuer: ACCESS_TOKEN_ISSUER
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    audience: ACCESS_TOKEN_AUDIENCE,
    issuer: ACCESS_TOKEN_ISSUER
  });
}

export function generateRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(refreshToken) {
  return createHash("sha256").update(refreshToken).digest("hex");
}
