import { prisma } from "../../db/prisma.js";

export function findUserForLogin(businessSlug, email) {
  return prisma.user.findFirst({
    where: {
      email,
      isActive: true,
      business: {
        is: {
          slug: businessSlug,
          isActive: true
        }
      }
    },
    include: {
      business: true
    }
  });
}

export function createAuthSession(data) {
  return prisma.authSession.create({
    data
  });
}

export function findSessionByRefreshTokenHash(refreshTokenHash) {
  return prisma.authSession.findFirst({
    where: {
      refreshTokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      },
      user: {
        is: {
          isActive: true
        }
      },
      business: {
        is: {
          isActive: true
        }
      }
    },
    include: {
      user: true,
      business: true
    }
  });
}

export function revokeSessionByRefreshTokenHash(refreshTokenHash) {
  return prisma.authSession.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export function rotateSession(currentSessionId, newSessionData) {
  return prisma.$transaction(async (tx) => {
    const newSession = await tx.authSession.create({
      data: newSessionData
    });

    await tx.authSession.update({
      where: {
        id: currentSessionId
      },
      data: {
        lastUsedAt: new Date(),
        revokedAt: new Date(),
        replacedBySessionId: newSession.id
      }
    });

    return newSession;
  });
}

export function findActiveUserContext(userId, businessId) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      businessId,
      isActive: true,
      business: {
        is: {
          isActive: true
        }
      }
    },
    include: {
      business: true
    }
  });
}
