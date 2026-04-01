import { prisma } from "../../db/prisma.js";

export function listOrderSourcesByBusinessId(businessId) {
  return prisma.orderSource.findMany({
    where: {
      businessId
    },
    orderBy: [{ sourceType: "asc" }, { name: "asc" }]
  });
}

export function findOrderSourceById(businessId, sourceId) {
  return prisma.orderSource.findFirst({
    where: {
      id: sourceId,
      businessId
    },
    include: {
      _count: {
        select: {
          orders: true
        }
      },
      business: true
    }
  });
}

export function findOrderSourceBySlug(businessId, slug, excludeId) {
  return prisma.orderSource.findFirst({
    where: {
      businessId,
      slug,
      ...(excludeId
        ? {
            id: {
              not: excludeId
            }
          }
        : {})
    }
  });
}

export function createOrderSource(data) {
  return prisma.orderSource.create({
    data
  });
}

export function updateOrderSource(businessId, sourceId, data) {
  return prisma.orderSource.update({
    where: {
      id: sourceId
    },
    data
  });
}

export function deleteOrderSource(sourceId) {
  return prisma.orderSource.delete({
    where: {
      id: sourceId
    }
  });
}
