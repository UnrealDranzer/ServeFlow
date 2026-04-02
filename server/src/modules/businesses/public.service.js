import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { fromPrismaOrderMode, fromPrismaSourceType } from "../../utils/enums.js";
import { ensureBusinessSettings } from "../settings/settings.repository.js";
import { findActiveBusinessBySlug } from "./businesses.repository.js";
import { toBusinessPublicDto } from "./businesses.dto.js";
import { buildOrderDraft } from "../orders/order-builder.js";
import { createOrderRecord, findOrderById } from "../orders/orders.repository.js";
import { toPublicOrderPlacedDto } from "../orders/orders.dto.js";

async function resolvePublicOrderContext(businessSlug, sourceSlug) {
  const business = await findActiveBusinessBySlug(businessSlug);

  if (!business) {
    throw ApiError.notFound("Business not found.");
  }

  const settings = business.settings || (await ensureBusinessSettings(business.id));

  const source = await prisma.orderSource.findFirst({
    where: {
      businessId: business.id,
      slug: sourceSlug,
      isActive: true
    }
  });

  if (!source) {
    throw ApiError.notFound("Order source not found.");
  }

  const orderMode = fromPrismaOrderMode(business.orderMode);

  if (!["qr", "both"].includes(orderMode)) {
    throw ApiError.forbidden("QR ordering is not enabled for this business.");
  }

  return {
    business,
    settings,
    source
  };
}

function toPublicMenuItemDto(menuItem, settings) {
  return {
    id: menuItem.id,
    name: menuItem.name,
    description: settings.showItemDescription ? menuItem.description : null,
    price: menuItem.price.toFixed(2),
    imageUrl: settings.showImages ? menuItem.imageUrl : null,
    isVeg: settings.showVegBadge ? menuItem.isVeg : null,
    isAvailable: menuItem.isAvailable,
    sortOrder: menuItem.sortOrder
  };
}

export async function getPublicMenu(businessSlug, sourceSlug) {
  const { business, settings, source } = await resolvePublicOrderContext(businessSlug, sourceSlug);

  const categories = await prisma.category.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      menuItems: {
        some: {
          isAvailable: true
        }
      }
    },
    include: {
      menuItems: {
        where: {
          isAvailable: true
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return {
    business: toBusinessPublicDto(business),
    source: {
      name: source.name,
      slug: source.slug,
      sourceType: fromPrismaSourceType(source.sourceType)
    },
    settings: {
      acceptingOrders: settings.acceptingOrders,
      showImages: settings.showImages,
      showItemDescription: settings.showItemDescription,
      showVegBadge: settings.showVegBadge
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      items: category.menuItems.map((menuItem) => toPublicMenuItemDto(menuItem, settings))
    }))
  };
}

export async function createPublicOrder(businessSlug, sourceSlug, input) {
  const { business, settings, source } = await resolvePublicOrderContext(businessSlug, sourceSlug);

  if (!settings.acceptingOrders) {
    throw ApiError.forbidden("This business is not accepting orders right now.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const draft = await buildOrderDraft({
      tx,
      businessId: business.id,
      items: input.items
    });

    const order = await tx.order.create({
      data: {
        businessId: business.id,
        orderSourceId: source.id,
        orderType: "QR",
        status: "NEW",
        subtotal: draft.subtotal,
        taxAmount: draft.taxAmount,
        discountAmount: draft.discountAmount,
        total: draft.total,
        customerNote: input.customerNote,
        placedByUserId: null,
      }
    });

    if (draft.orderItemsData.length > 0) {
      await tx.orderItem.createMany({
        data: draft.orderItemsData.map((item) => ({
          ...item,
          orderId: order.id,
          businessId: business.id,
        })),
      });
    }

    return findOrderById(business.id, order.id, tx);
  });

  return toPublicOrderPlacedDto(order);
}
