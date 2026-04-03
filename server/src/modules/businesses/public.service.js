import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { fromPrismaOrderMode, fromPrismaOrderStatus, fromPrismaSourceType } from "../../utils/enums.js";
import { moneyToString, toDecimal } from "../../utils/money.js";
import { ensureBusinessSettings } from "../settings/settings.repository.js";
import { findActiveBusinessBySlug } from "./businesses.repository.js";
import { toBusinessPublicDto } from "./businesses.dto.js";
import { buildOrderDraft } from "../orders/order-builder.js";
import {
  deleteOrderItemsByOrderId,
  findLatestActiveQrOrderForSource,
  findOrderById,
  updateOrderTotals
} from "../orders/orders.repository.js";
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

function normalizeCustomerNote(note) {
  return note?.trim() || null;
}

function mergeCustomerNotes(existingNote, incomingNote) {
  const currentNote = normalizeCustomerNote(existingNote);
  const nextNote = normalizeCustomerNote(incomingNote);

  if (!nextNote) {
    return currentNote;
  }

  if (!currentNote) {
    return nextNote;
  }

  if (currentNote.toLowerCase() === nextNote.toLowerCase()) {
    return currentNote;
  }

  return `${currentNote}\n${nextNote}`;
}

function buildMergeKey(item) {
  return [
    item.menuItemId,
    item.itemNameSnapshot,
    toDecimal(item.itemPriceSnapshot).toFixed(2),
    item.itemNote || ""
  ].join("::");
}

function mergeOrderItems(existingOrder, incomingOrderItemsData) {
  const mergedItems = [];
  const mergedItemsByKey = new Map();

  function upsertLineItem(item) {
    const normalizedItem = {
      menuItemId: item.menuItemId,
      itemNameSnapshot: item.itemNameSnapshot,
      itemPriceSnapshot: toDecimal(item.itemPriceSnapshot),
      quantity: item.quantity,
      itemNote: item.itemNote || null,
      lineTotal: toDecimal(item.itemPriceSnapshot).mul(item.quantity)
    };
    const key = buildMergeKey(normalizedItem);
    const existingItem = mergedItemsByKey.get(key);

    if (!existingItem) {
      mergedItemsByKey.set(key, normalizedItem);
      mergedItems.push(normalizedItem);
      return;
    }

    existingItem.quantity += normalizedItem.quantity;
    existingItem.lineTotal = existingItem.itemPriceSnapshot.mul(existingItem.quantity);
  }

  existingOrder.items.forEach(upsertLineItem);
  incomingOrderItemsData.forEach(upsertLineItem);

  return mergedItems;
}

function toPublicActiveOrderDto(order) {
  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    status: fromPrismaOrderStatus(order.status),
    placedAt: order.placedAt.toISOString(),
    total: moneyToString(order.total),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

export async function getPublicMenu(businessSlug, sourceSlug) {
  const { business, settings, source } = await resolvePublicOrderContext(businessSlug, sourceSlug);
  const activeOrder = await findLatestActiveQrOrderForSource(business.id, source.id);

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
    activeOrder: toPublicActiveOrderDto(activeOrder),
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

  const result = await prisma.$transaction(async (tx) => {
    const activeOrder = await findLatestActiveQrOrderForSource(business.id, source.id, tx);
    const draft = await buildOrderDraft({
      tx,
      businessId: business.id,
      items: input.items
    });

    if (activeOrder) {
      const mergedOrderItemsData = mergeOrderItems(activeOrder, draft.orderItemsData);
      const subtotal = mergedOrderItemsData.reduce(
        (sum, item) => sum.add(item.lineTotal),
        toDecimal(0)
      );
      const taxAmount = toDecimal(activeOrder.taxAmount || 0);
      const discountAmount = toDecimal(activeOrder.discountAmount || 0);

      await deleteOrderItemsByOrderId(tx, business.id, activeOrder.id);

      if (mergedOrderItemsData.length > 0) {
        await tx.orderItem.createMany({
          data: mergedOrderItemsData.map((item) => ({
            ...item,
            orderId: activeOrder.id,
            businessId: business.id
          }))
        });
      }

      const updatedOrder = await updateOrderTotals(tx, activeOrder.id, {
        subtotal,
        taxAmount,
        discountAmount,
        total: subtotal.add(taxAmount).sub(discountAmount),
        customerNote: mergeCustomerNotes(activeOrder.customerNote, input.customerNote)
      });

      return {
        order: updatedOrder,
        action: "updated"
      };
    }

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

    return {
      order: await findOrderById(business.id, order.id, tx),
      action: "created"
    };
  });

  return toPublicOrderPlacedDto(result.order, { action: result.action });
}
