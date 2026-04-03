import { sendSuccess } from "../../utils/responses.js";
import { requireBusinessId } from "../../utils/tenant-context.js";
import { getDashboardRecentOrders, getDashboardStats, getDashboardSummary } from "./dashboard.service.js";

export async function getDashboardSummaryController(req, res) {
  const businessId = requireBusinessId(req);
  const summary = await getDashboardSummary(businessId);

  sendSuccess(res, summary);
}

export async function getDashboardStatsController(req, res) {
  const businessId = requireBusinessId(req);
  const stats = await getDashboardStats(businessId, req.query.range);

  sendSuccess(res, stats);
}

export async function getRecentOrdersController(req, res) {
  const businessId = requireBusinessId(req);
  const recentOrders = await getDashboardRecentOrders(businessId, req.query.limit);

  sendSuccess(res, recentOrders);
}
