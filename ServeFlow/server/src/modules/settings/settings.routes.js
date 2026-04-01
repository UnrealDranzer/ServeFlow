import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireOwner } from "../../middlewares/authorize.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { getSettingsController, updateSettingsController } from "./settings.controller.js";
import { updateSettingsBodySchema } from "./settings.schemas.js";

const router = Router();

router.get("/", requireOwner, asyncHandler(getSettingsController));
router.put(
  "/",
  requireOwner,
  validateRequest({ body: updateSettingsBodySchema }),
  asyncHandler(updateSettingsController)
);

export default router;
