import { prisma } from "../../db/prisma.js";

export function upsertBusinessSettings(businessId) {
  return prisma.businessSettings.upsert({
    where: {
      businessId
    },
    update: {},
    create: {
      businessId
    }
  });
}

export async function ensureBusinessSettings(businessId) {
  return upsertBusinessSettings(businessId);
}

export async function findSettingsBundleByBusinessId(businessId) {
  await ensureBusinessSettings(businessId);

  return prisma.business.findUnique({
    where: {
      id: businessId
    },
    include: {
      settings: true
    }
  });
}

export function updateBusinessAndSettings(businessId, businessData, settingsData) {
  return prisma.$transaction(async (tx) => {
    const business = await tx.business.update({
      where: {
        id: businessId
      },
      data: businessData
    });

    const settings = await tx.businessSettings.upsert({
      where: {
        businessId
      },
      update: settingsData,
      create: {
        businessId,
        ...settingsData
      }
    });

    return {
      business,
      settings
    };
  });
}
