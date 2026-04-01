import { z } from "zod";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/tokens.js";

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  businessId: z.string().uuid(),
  sessionId: z.string().uuid(),
  role: z.enum(["OWNER", "STAFF"]),
  type: z.literal("access")
});

function readBearerToken(req) {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw ApiError.unauthorized("Invalid authorization header.");
  }

  return token.trim();
}

export function authenticate(req, res, next) {
  try {
    const token = readBearerToken(req);

    if (!token) {
      throw ApiError.unauthorized("Authentication required.");
    }

    const decoded = verifyAccessToken(token);
    const payload = accessTokenPayloadSchema.parse(decoded);

    req.auth = {
      userId: payload.sub,
      businessId: payload.businessId,
      sessionId: payload.sessionId,
      role: payload.role
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      next(ApiError.unauthorized("Access token expired."));
      return;
    }

    if (error.name === "JsonWebTokenError" || error.name === "ZodError") {
      next(ApiError.unauthorized("Invalid access token."));
      return;
    }

    next(error);
  }
}

export function optionalAuthenticate(req, res, next) {
  try {
    const token = readBearerToken(req);

    if (!token) {
      next();
      return;
    }

    const decoded = verifyAccessToken(token);
    const payload = accessTokenPayloadSchema.parse(decoded);

    req.auth = {
      userId: payload.sub,
      businessId: payload.businessId,
      sessionId: payload.sessionId,
      role: payload.role
    };

    next();
  } catch {
    next();
  }
}
