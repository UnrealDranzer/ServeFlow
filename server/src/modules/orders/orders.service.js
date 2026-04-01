import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { fromPrismaOrderMode, fromPrismaOrderStatus, toPrismaOrderStatus, toPrismaOrderType } from "../../utils/enums.js";
import { toOrderDetailDto, toOrderListDto } from "./orders.dto.js";
import { buildOrderDraft } from "./order-builder.js";
import {
  createOrderRecord,
  findActiveOrderSourceForBusiness,
  findOrderById,
  listOrdersByBusinessId,
  updateOrderStatusById
} from "./orders.repository.js";
import { findBusinessById } from "../businesses/businesses.repository.js";

const allowedStatusTransitions = {
  new: ["accepted", "preparing", "ready", "served", "paid", "cancelled"],
  accepted: ["preparing", "ready", "served", "paid", "cancelled"],
  preparing: ["ready", "served", "paid", "cancelled"],
  ready: ["served", "paid", "cancelled"],
  served: ["paid"],
  paid: [],
  cancelled: []
};

function assertBusinessAllowsManualOrders(business) {
  const orderMode = fromPrismaOrderMode(business.orderMode);

  if (!["manual", "both"].includes(orderMode)) {
    throw ApiError.forbidden("Manual order entry is not enabled for this business.");
  }
}

export async function listOrders(businessId, query) {
  const filters = {
    ...query,
    statuses: query.status?.map(toPrismaOrderStatus),
    orderType: query.orderType ? toPrismaOrderType(query.orderType) : undefined,
    dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
    dateTo: query.dateTo ? new Date(query.dateTo) : undefined
  };

  const { orders, totalCount } = await listOrdersByBusinessId(businessId, filters);

  return {
    items: orders.map(toOrderListDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize))
    }
  };
}

export async function getOrderDetails(businessId, orderId) {
  const order = await findOrderById(businessId, orderId);

  if (!order) {
    throw ApiError.notFound("Order not found.");
  }

  return toOrderDetailDto(order);
}

export async function createManualOrderForBusiness(businessId, userId, input) {
  const business = await findBusinessById(businessId);

  if (!business) {
    throw ApiError.notFound("Business not found.");
  }

  assertBusinessAllowsManualOrders(business);

  const source = await findActiveOrderSourceForBusiness(businessId, input.sourceId);

  if (!source) {
    throw ApiError.badRequest("Order source must exist and be active within your business.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const draft = await buildOrderDraft({
      tx,
      businessId,
      items: input.items
    });

    return createOrderRecord(tx, {
      businessId,
      orderSourceId: source.id,
      orderType: "MANUAL",
      status: "NEW",
      subtotal: draft.subtotal,
      taxAmount: draft.taxAmount,
      discountAmount: draft.discountAmount,
      total: draft.total,
      customerNote: input.customerNote,
      placedByUserId: userId,
      items: {
        create: draft.orderItemsData.map(({ businessId: _, ...item }) => item)
      }
    });
  });

  return toOrderDetailDto(order);
}

export async function updateOrderStatusForBusiness(businessId, orderId, nextStatus) {
  const order = await findOrderById(businessId, orderId);

  if (!order) {
    throw ApiError.notFound("Order not found.");
  }

  const currentStatus = fromPrismaOrderStatus(order.status);

  if (currentStatus === nextStatus) {
    return toOrderDetailDto(order);
  }

  const allowedTransitions = allowedStatusTransitions[currentStatus];

  if (!allowedTransitions.includes(nextStatus)) {
    throw ApiError.conflict(`Cannot move order from ${currentStatus} to ${nextStatus}.`);
  }

  const updatedOrder = await updateOrderStatusById(
    order.id,
    toPrismaOrderStatus(nextStatus),
    nextStatus === "paid" ? new Date() : undefined
  );

  return toOrderDetailDto(updatedOrder);
}
