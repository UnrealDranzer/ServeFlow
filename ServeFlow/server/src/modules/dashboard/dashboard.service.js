import { ApiError } from "../../utils/api-error.js";
import { moneyToString } from "../../utils/money.js";
import { getTodayRangeInTimeZone } from "../../utils/timezone.js";
import { findSettingsBundleByBusinessId } from "../settings/settings.repository.js";
import {
  aggregateTodaySales,
  averageOrderValueForToday,
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

export async function getDashboardRecentOrders(businessId, limit) {
  const orders = await listRecentOrdersByBusinessId(businessId, limit);
  return orders.map(toOrderListDto);
}
