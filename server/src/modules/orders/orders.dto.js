import {
  fromPrismaOrderStatus,
  fromPrismaOrderType,
  fromPrismaSourceType,
  fromPrismaUserRole
} from "../../utils/enums.js";
import { moneyToString } from "../../utils/money.js";

function toOrderItemDto(orderItem) {
  return {
    id: orderItem.id,
    menuItemId: orderItem.menuItemId,
    itemNameSnapshot: orderItem.itemNameSnapshot,
    itemPriceSnapshot: moneyToString(orderItem.itemPriceSnapshot),
    quantity: orderItem.quantity,
    itemNote: orderItem.itemNote,
    lineTotal: moneyToString(orderItem.lineTotal),
    createdAt: orderItem.createdAt.toISOString()
  };
}

function toOrderItemSummaryDto(orderItem) {
  return {
    itemNameSnapshot: orderItem.itemNameSnapshot,
    quantity: orderItem.quantity,
    lineTotal: moneyToString(orderItem.lineTotal)
  };
}

function toPlacedByDto(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: fromPrismaUserRole(user.role)
  };
}

function toOrderSourceDto(orderSource) {
  return {
    id: orderSource.id,
    name: orderSource.name,
    slug: orderSource.slug,
    sourceType: fromPrismaSourceType(orderSource.sourceType)
  };
}

export function toOrderListDto(order) {
  return {
    id: order.id,
    orderType: fromPrismaOrderType(order.orderType),
    status: fromPrismaOrderStatus(order.status),
    subtotal: moneyToString(order.subtotal),
    taxAmount: moneyToString(order.taxAmount),
    discountAmount: moneyToString(order.discountAmount),
    total: moneyToString(order.total),
    customerNote: order.customerNote,
    placedAt: order.placedAt.toISOString(),
    paidAt: order.paidAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    source: toOrderSourceDto(order.orderSource),
    placedBy: toPlacedByDto(order.placedByUser),
    itemCount: order.items.length,
    items: order.items.map(toOrderItemSummaryDto)
  };
}

export function toOrderDetailDto(order) {
  return {
    ...toOrderListDto(order),
    items: order.items.map(toOrderItemDto)
  };
}

export function toPublicOrderPlacedDto(order) {
  return {
    orderId: order.id,
    status: fromPrismaOrderStatus(order.status),
    total: moneyToString(order.total),
    placedAt: order.placedAt.toISOString(),
    source: toOrderSourceDto(order.orderSource),
    items: order.items.map(toOrderItemSummaryDto)
  };
}
