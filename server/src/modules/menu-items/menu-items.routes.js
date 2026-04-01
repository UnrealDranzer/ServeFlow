import { Router } from "express";
import { requireOwner } from "../../middlewares/authorize.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createMenuItemController,
  deleteMenuItemController,
  listMenuItemsController,
  patchMenuItemAvailabilityController,
  updateMenuItemController
} from "./menu-items.controller.js";
import {
  createMenuItemBodySchema,
  listMenuItemsQuerySchema,
  menuItemParamsSchema,
  patchAvailabilityBodySchema,
  updateMenuItemBodySchema
} from "./menu-items.schemas.js";

const router = Router();

router.get("/", validateRequest({ query: listMenuItemsQuerySchema }), asyncHandler(listMenuItemsController));
router.post(
  "/",
  requireOwner,
  validateRequest({ body: createMenuItemBodySchema }),
  asyncHandler(createMenuItemController)
);
router.put(
  "/:id",
  requireOwner,
  validateRequest({ params: menuItemParamsSchema, body: updateMenuItemBodySchema }),
  asyncHandler(updateMenuItemController)
);
router.delete(
  "/:id",
  requireOwner,
  validateRequest({ params: menuItemParamsSchema }),
  asyncHandler(deleteMenuItemController)
);
router.patch(
  "/:id/availability",
  requireOwner,
  validateRequest({ params: menuItemParamsSchema, body: patchAvailabilityBodySchema }),
  asyncHandler(patchMenuItemAvailabilityController)
);

export default router;
