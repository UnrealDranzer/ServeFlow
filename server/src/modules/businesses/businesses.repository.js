import { prisma } from "../../db/prisma.js";

export function findBusinessById(businessId) {
  return prisma.business.findUnique({
    where: {
      id: businessId
    }
  });
}

export function findBusinessWithSettingsById(businessId) {
  return prisma.business.findUnique({
    where: {
      id: businessId
    },
    include: {
      settings: true
    }
  });
}

export function findActiveBusinessBySlug(businessSlug) {
  return prisma.business.findFirst({
    where: {
      slug: businessSlug,
      isActive: true
    },
    include: {
      settings: true
    }
  });
}
