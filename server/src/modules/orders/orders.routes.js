import { Router } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createManualOrderController,
  editOrderItemsController,
  getOrderController,
  listOrdersController,
  updateOrderStatusController
} from "./orders.controller.js";
import {
  editOrderBodySchema,
  listOrdersQuerySchema,
  manualOrderBodySchema,
  orderParamsSchema,
  updateOrderStatusBodySchema
} from "./orders.schemas.js";

const router = Router();

router.get("/", validateRequest({ query: listOrdersQuerySchema }), asyncHandler(listOrdersController));
router.get("/:id", validateRequest({ params: orderParamsSchema }), asyncHandler(getOrderController));
router.post(
  "/manual",
  validateRequest({ body: manualOrderBodySchema }),
  asyncHandler(createManualOrderController)
);
router.patch(
  "/:id/status",
  validateRequest({ params: orderParamsSchema, body: updateOrderStatusBodySchema }),
  asyncHandler(updateOrderStatusController)
);
router.put(
  "/:id/items",
  validateRequest({ params: orderParamsSchema, body: editOrderBodySchema }),
  asyncHandler(editOrderItemsController)
);

export default router;
