import { prisma } from "../../db/prisma.js";

export function listCategoriesByBusinessId(businessId, { activeOnly = false } = {}) {
  return prisma.category.findMany({
    where: {
      businessId,
      ...(activeOnly ? { isActive: true } : {})
    },
    include: {
      _count: {
        select: {
          menuItems: true
        }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
}

export function findCategoryById(businessId, categoryId) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      businessId
    },
    include: {
      _count: {
        select: {
          menuItems: true
        }
      }
    }
  });
}

export function findCategoryByName(businessId, name, excludeId) {
  return prisma.category.findFirst({
    where: {
      businessId,
      name: {
        equals: name,
        mode: "insensitive"
      },
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

export function createCategory(data) {
  return prisma.category.create({
    data,
    include: {
      _count: {
        select: {
          menuItems: true
        }
      }
    }
  });
}

export function updateCategory(businessId, categoryId, data) {
  return prisma.category.update({
    where: {
      id: categoryId
    },
    data,
    include: {
      _count: {
        select: {
          menuItems: true
        }
      }
    }
  });
}

export function deleteCategory(categoryId) {
  return prisma.category.delete({
    where: {
      id: categoryId
    }
  });
}
