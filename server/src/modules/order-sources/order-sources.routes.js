import { Router } from "express";
import { requireOwner } from "../../middlewares/authorize.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createOrderSourceController,
  deleteOrderSourceController,
  getOrderSourceQrController,
  listOrderSourcesController,
  updateOrderSourceController
} from "./order-sources.controller.js";
import {
  createOrderSourceBodySchema,
  orderSourceParamsSchema,
  updateOrderSourceBodySchema
} from "./order-sources.schemas.js";

const router = Router();

router.get("/", asyncHandler(listOrderSourcesController));
router.post(
  "/",
  requireOwner,
  validateRequest({ body: createOrderSourceBodySchema }),
  asyncHandler(createOrderSourceController)
);
router.put(
  "/:id",
  requireOwner,
  validateRequest({ params: orderSourceParamsSchema, body: updateOrderSourceBodySchema }),
  asyncHandler(updateOrderSourceController)
);
router.delete(
  "/:id",
  requireOwner,
  validateRequest({ params: orderSourceParamsSchema }),
  asyncHandler(deleteOrderSourceController)
);
router.get(
  "/:id/qr",
  validateRequest({ params: orderSourceParamsSchema }),
  asyncHandler(getOrderSourceQrController)
);

export default router;
