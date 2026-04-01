import { Router } from "express";
import { requireOwner } from "../../middlewares/authorize.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createCategoryController,
  deleteCategoryController,
  listCategoriesController,
  updateCategoryController
} from "./categories.controller.js";
import {
  categoryParamsSchema,
  createCategoryBodySchema,
  listCategoriesQuerySchema,
  updateCategoryBodySchema
} from "./categories.schemas.js";

const router = Router();

router.get("/", validateRequest({ query: listCategoriesQuerySchema }), asyncHandler(listCategoriesController));
router.post(
  "/",
  requireOwner,
  validateRequest({ body: createCategoryBodySchema }),
  asyncHandler(createCategoryController)
);
router.put(
  "/:id",
  requireOwner,
  validateRequest({ params: categoryParamsSchema, body: updateCategoryBodySchema }),
  asyncHandler(updateCategoryController)
);
router.delete(
  "/:id",
  requireOwner,
  validateRequest({ params: categoryParamsSchema }),
  asyncHandler(deleteCategoryController)
);

export default router;
