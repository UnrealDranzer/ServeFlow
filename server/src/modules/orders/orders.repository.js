import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

const orderInclude = {
  orderSource: {
    select: {
      id: true,
      name: true,
      slug: true,
      sourceType: true
    }
  },
  placedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  items: {
    select: {
      id: true,
      menuItemId: true,
      itemNameSnapshot: true,
      itemPriceSnapshot: true,
      quantity: true,
      itemNote: true,
      lineTotal: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "asc"
    }
  }
};

export function findActiveOrderSourceForBusiness(businessId, sourceId) {
  return prisma.orderSource.findFirst({
    where: {
      id: sourceId,
      businessId,
      isActive: true
    }
  });
}

export function findOrderById(businessId, orderId, tx = prisma) {
  return tx.order.findFirst({
    where: {
      id: orderId,
      businessId
    },
    include: orderInclude
  });
}

export function createOrderRecord(tx, data) {
  return tx.order.create({
    data,
    include: orderInclude
  });
}

export async function listOrdersByBusinessId(businessId, filters) {
  const where = {
    businessId,
    ...(filters.statuses?.length
      ? {
          status: {
            in: filters.statuses
          }
        }
      : {}),
    ...(filters.orderType
      ? {
          orderType: filters.orderType
        }
      : {}),
    ...(filters.sourceId
      ? {
          orderSourceId: filters.sourceId
        }
      : {}),
    ...((filters.dateFrom || filters.dateTo)
      ? {
          placedAt: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {})
          }
        }
      : {})
  };

  const skip = (filters.page - 1) * filters.pageSize;

  const [orders, totalCount] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: {
        placedAt: "desc"
      },
      skip,
      take: filters.pageSize
    }),
    prisma.order.count({
      where
    })
  ]);

  return {
    orders,
    totalCount
  };
}

export function updateOrderStatusById(orderId, status, paidAt) {
  return prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      status,
      ...(paidAt ? { paidAt } : {})
    },
    include: orderInclude
  });
}

export function listRecentOrdersByBusinessId(businessId, limit) {
  return prisma.order.findMany({
    where: {
      businessId
    },
    include: orderInclude,
    orderBy: {
      placedAt: "desc"
    },
    take: limit
  });
}

export function aggregateTodaySales(businessId, start, end) {
  return prisma.order.aggregate({
    where: {
      businessId,
      status: "PAID",
      paidAt: {
        gte: start,
        lt: end
      }
    },
    _sum: {
      total: true
    }
  });
}

export function countTodayOrders(businessId, start, end) {
  return prisma.order.count({
    where: {
      businessId,
      placedAt: {
        gte: start,
        lt: end
      }
    }
  });
}

export function countPendingOrders(businessId) {
  return prisma.order.count({
    where: {
      businessId,
      status: {
        in: ["NEW", "ACCEPTED", "PREPARING", "READY"]
      }
    }
  });
}

export function averageOrderValueForToday(businessId, start, end) {
  return prisma.order.aggregate({
    where: {
      businessId,
      status: {
        not: "CANCELLED"
      },
      placedAt: {
        gte: start,
        lt: end
      }
    },
    _avg: {
      total: true
    }
  });
}
