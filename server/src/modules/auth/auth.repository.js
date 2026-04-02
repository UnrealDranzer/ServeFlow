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

export function findBusinessForRegistration(slug) {
  return prisma.business.findFirst({
    where: {
      slug
    }
  });
}

export function findExistingUserByEmail(email) {
  return prisma.user.findFirst({
    where: {
      email
    }
  });
}

export function createBusinessOwnerRegistration(data) {
  return prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: data.business.name,
        slug: data.business.slug,
        businessType: data.business.businessType,
        ownerName: data.business.ownerName,
        email: data.business.email,
        phone: data.business.phone,
        logoUrl: data.business.logoUrl,
        currency: data.business.currency,
        orderMode: data.business.orderMode,
        isActive: data.business.isActive
      }
    });

    const user = await tx.user.create({
      data: {
        businessId: business.id,
        name: data.owner.name,
        email: data.owner.email,
        passwordHash: data.owner.passwordHash,
        role: data.owner.role,
        isActive: true
      }
    });

    await tx.businessSettings.create({
      data: {
        businessId: business.id,
        acceptingOrders: data.settings.acceptingOrders,
        showImages: data.settings.showImages,
        showItemDescription: data.settings.showItemDescription,
        showVegBadge: data.settings.showVegBadge,
        timezone: data.settings.timezone
      }
    });

    if (data.orderSources.length > 0) {
      await tx.orderSource.createMany({
        data: data.orderSources.map((source) => ({
          businessId: business.id,
          name: source.name,
          slug: source.slug,
          sourceType: source.sourceType,
          qrUrl: source.qrUrl,
          isActive: source.isActive
        }))
      });
    }

    return {
      business,
      user
    };
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
