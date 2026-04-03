import { Router } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  getDashboardStatsController,
  getDashboardSummaryController,
  getRecentOrdersController
} from "./dashboard.controller.js";
import { dashboardStatsQuerySchema, recentOrdersQuerySchema } from "./dashboard.schemas.js";

const router = Router();

router.get("/summary", asyncHandler(getDashboardSummaryController));
router.get("/stats", validateRequest({ query: dashboardStatsQuerySchema }), asyncHandler(getDashboardStatsController));
router.get(
  "/recent-orders",
  validateRequest({ query: recentOrdersQuerySchema }),
  asyncHandler(getRecentOrdersController)
);

export default router;
