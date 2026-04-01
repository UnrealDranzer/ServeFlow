import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { ensureActiveAccount } from "../../middlewares/ensure-active-account.js";
import { requireCsrfHeader } from "../../middlewares/require-csrf-header.js";
import { authLimiter } from "../../middlewares/rate-limiters.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  loginController,
  logoutController,
  meController,
  refreshController
} from "./auth.controller.js";
import { loginBodySchema } from "./auth.schemas.js";

const router = Router();

router.post("/login", authLimiter, validateRequest({ body: loginBodySchema }), asyncHandler(loginController));
router.post("/refresh", authLimiter, requireCsrfHeader, asyncHandler(refreshController));
router.get("/me", authenticate, asyncHandler(ensureActiveAccount), asyncHandler(meController));
router.post("/logout", requireCsrfHeader, asyncHandler(logoutController));

export default router;
