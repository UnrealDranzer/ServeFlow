import { ApiError } from "../../utils/api-error.js";
import { toPrismaBusinessType, toPrismaOrderMode, toPrismaSourceType, toPrismaUserRole } from "../../utils/enums.js";
import {
  clearRefreshTokenCookie,
  getRefreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME
} from "../../utils/cookies.js";
import { generateRefreshToken, generateAccessToken, hashRefreshToken } from "../../utils/tokens.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import {
  createBusinessOwnerRegistration,
  createAuthSession,
  findActiveUserContext,
  findBusinessForRegistration,
  findExistingUserByEmail,
  findSessionByRefreshTokenHash,
  findUserForLogin,
  revokeSessionByRefreshTokenHash,
  rotateSession
} from "./auth.repository.js";
import { toAuthSessionDto, toRegistrationDto } from "./auth.dto.js";
import { env } from "../../config/env.js";

function buildSessionExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);
  return expiresAt;
}

function buildClientMeta(req) {
  return {
    userAgent: req.get("user-agent")?.slice(0, 512) || null,
    ipAddress: req.ip || null
  };
}

function buildPublicMenuUrl(businessSlug, sourceSlug) {
  return `${env.PUBLIC_APP_URL.replace(/\/+$/, "")}/menu/${businessSlug}/${sourceSlug}`;
}

async function issueAuthenticatedSession({ user, business, clientMeta }) {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const session = await createAuthSession({
    businessId: business.id,
    userId: user.id,
    refreshTokenHash,
    userAgent: clientMeta.userAgent,
    ipAddress: clientMeta.ipAddress,
    expiresAt: buildSessionExpiryDate()
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    businessId: business.id,
    role: user.role,
    sessionId: session.id
  });

  return {
    refreshToken,
    payload: toAuthSessionDto({
      accessToken,
      user,
      business
    })
  };
}

export async function registerBusinessOwner(input) {
  const existingBusiness = await findBusinessForRegistration(input.businessSlug);

  if (existingBusiness) {
    throw ApiError.conflict("A business with this slug already exists.");
  }

  const existingUser = await findExistingUserByEmail(input.email);

  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);

  const registration = await createBusinessOwnerRegistration({
    business: {
      name: input.businessName,
      slug: input.businessSlug,
      businessType: toPrismaBusinessType(input.businessType),
      ownerName: input.ownerName,
      email: input.email,
      phone: input.phone || "",
      logoUrl: null,
      currency: "INR",
      orderMode: toPrismaOrderMode("both"),
      isActive: true
    },
    owner: {
      name: input.ownerName,
      email: input.email,
      passwordHash,
      role: toPrismaUserRole("owner")
    },
    settings: {
      acceptingOrders: true,
      showImages: true,
      showItemDescription: true,
      showVegBadge: true,
      timezone: "Asia/Kolkata"
    },
    orderSources: [
      {
        name: "Counter",
        slug: "counter",
        sourceType: toPrismaSourceType("counter"),
        qrUrl: buildPublicMenuUrl(input.businessSlug, "counter"),
        isActive: true
      },
      {
        name: "Takeaway",
        slug: "takeaway",
        sourceType: toPrismaSourceType("takeaway"),
        qrUrl: buildPublicMenuUrl(input.businessSlug, "takeaway"),
        isActive: true
      }
    ]
  });

  return toRegistrationDto(registration);
}

export async function loginUser(input, req, res) {
  const user = await findUserForLogin(input.businessSlug, input.email);

  if (!user) {
    throw ApiError.unauthorized("Invalid business, email, or password.");
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid business, email, or password.");
  }

  const clientMeta = buildClientMeta(req);
  const { refreshToken, payload } = await issueAuthenticatedSession({
    user,
    business: user.business,
    clientMeta
  });

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

  return payload;
}

export async function refreshUserSession(req, res) {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token is required.");
  }

  const existingSession = await findSessionByRefreshTokenHash(hashRefreshToken(refreshToken));

  if (!existingSession) {
    clearRefreshTokenCookie(res);
    throw ApiError.unauthorized("Refresh token is invalid or expired.");
  }

  const nextRefreshToken = generateRefreshToken();
  const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);
  const clientMeta = buildClientMeta(req);

  const newSession = await rotateSession(existingSession.id, {
    businessId: existingSession.businessId,
    userId: existingSession.userId,
    refreshTokenHash: nextRefreshTokenHash,
    userAgent: clientMeta.userAgent,
    ipAddress: clientMeta.ipAddress,
    expiresAt: buildSessionExpiryDate()
  });

  const accessToken = generateAccessToken({
    userId: existingSession.user.id,
    businessId: existingSession.business.id,
    role: existingSession.user.role,
    sessionId: newSession.id
  });

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, nextRefreshToken, getRefreshTokenCookieOptions());

  return toAuthSessionDto({
    accessToken,
    user: existingSession.user,
    business: existingSession.business
  });
}

export async function getAuthenticatedUser(req) {
  const user = await findActiveUserContext(req.auth.userId, req.auth.businessId);

  if (!user) {
    throw ApiError.unauthorized("Your account is no longer active.");
  }

  return toAuthSessionDto({
    accessToken: null,
    user,
    business: user.business
  });
}

export async function logoutUser(req, res) {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

  if (refreshToken) {
    await revokeSessionByRefreshTokenHash(hashRefreshToken(refreshToken));
  }

  clearRefreshTokenCookie(res);

  return {
    success: true
  };
}
