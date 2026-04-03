import { ApiError } from "../../utils/api-error.js";
import { moneyToString } from "../../utils/money.js";
import { getRangeInTimeZone, getTodayRangeInTimeZone } from "../../utils/timezone.js";
import { findSettingsBundleByBusinessId } from "../settings/settings.repository.js";
import {
  aggregatePaidSalesForRange,
  aggregateTodaySales,
  averageOrderValueForToday,
  countPaidOrdersForRange,
  countPendingOrders,
  countTodayOrders,
  listRecentOrdersByBusinessId
} from "../orders/orders.repository.js";
import { toOrderListDto } from "../orders/orders.dto.js";

export async function getDashboardSummary(businessId) {
  const bundle = await findSettingsBundleByBusinessId(businessId);

  if (!bundle?.settings) {
    throw ApiError.notFound("Business settings were not found.");
  }

  const { start, end } = getTodayRangeInTimeZone(bundle.settings.timezone);

  const [todaySalesResult, todayOrders, pendingOrders, averageOrderValueResult] = await Promise.all([
    aggregateTodaySales(businessId, start, end),
    countTodayOrders(businessId, start, end),
    countPendingOrders(businessId),
    averageOrderValueForToday(businessId, start, end)
  ]);

  return {
    timezone: bundle.settings.timezone,
    todaySales: moneyToString(todaySalesResult._sum.total || 0),
    todayOrders,
    pendingOrders,
    averageOrderValue: moneyToString(averageOrderValueResult._avg.total || 0)
  };
}

export async function getDashboardStats(businessId, range) {
  const bundle = await findSettingsBundleByBusinessId(businessId);

  if (!bundle?.settings) {
    throw ApiError.notFound("Business settings were not found.");
  }

  const { start, end } = getRangeInTimeZone(range, bundle.settings.timezone);
  const [salesResult, paidOrders, pendingOrders] = await Promise.all([
    aggregatePaidSalesForRange(businessId, start, end),
    countPaidOrdersForRange(businessId, start, end),
    countPendingOrders(businessId)
  ]);

  return {
    timezone: bundle.settings.timezone,
    range,
    sales: moneyToString(salesResult._sum.total || 0),
    totalOrders: paidOrders,
    pendingOrders
  };
}

export async function getDashboardRecentOrders(businessId, limit) {
  const orders = await listRecentOrdersByBusinessId(businessId, limit);
  return orders.map(toOrderListDto);
}
