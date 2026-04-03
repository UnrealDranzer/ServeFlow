import { z } from "zod";

export const recentOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10)
});

export const dashboardStatsRangeValues = ["today", "yesterday", "week", "month", "all"];

export const dashboardStatsQuerySchema = z.object({
  range: z.enum(dashboardStatsRangeValues).default("today")
});
