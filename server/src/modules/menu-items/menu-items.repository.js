import { prisma } from "../../db/prisma.js";

export function findActiveCategoryForBusiness(businessId, categoryId) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      businessId,
      isActive: true
    }
  });
}

export function listMenuItemsByBusinessId(businessId, filters) {
  return prisma.menuItem.findMany({
    where: {
      businessId,
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.availableOnly
        ? {
            isAvailable: true,
            category: {
              is: {
                isActive: true
              }
            }
          }
        : {}),
      ...(filters.search
        ? {
            name: {
              contains: filters.search,
              mode: "insensitive"
            }
          }
        : {})
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
}

export function findMenuItemById(businessId, menuItemId) {
  return prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      businessId
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          orderItems: true
        }
      }
    }
  });
}

export function createMenuItem(data) {
  return prisma.menuItem.create({
    data,
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

export function updateMenuItem(businessId, menuItemId, data) {
  return prisma.menuItem.update({
    where: {
      id: menuItemId
    },
    data,
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

export function deleteMenuItem(menuItemId) {
  return prisma.menuItem.delete({
    where: {
      id: menuItemId
    }
  });
}
