import { Router } from "express";
import { publicOrderLimiter } from "../../middlewares/rate-limiters.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createPublicOrderController, getPublicMenuController } from "./public.controller.js";
import { createPublicOrderBodySchema, publicRouteParamsSchema } from "./public.schemas.js";

const router = Router();

router.get(
  "/:businessSlug/:sourceSlug/menu",
  validateRequest({ params: publicRouteParamsSchema }),
  asyncHandler(getPublicMenuController)
);

router.post(
  "/:businessSlug/:sourceSlug/orders",
  publicOrderLimiter,
  validateRequest({ params: publicRouteParamsSchema, body: createPublicOrderBodySchema }),
  asyncHandler(createPublicOrderController)
);

export default router;
