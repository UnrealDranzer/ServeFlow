import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { ensureActiveAccount } from "../middlewares/ensure-active-account.js";
import { asyncHandler } from "../utils/async-handler.js";
import authRoutes from "./auth/auth.routes.js";
import publicRoutes from "./businesses/public.routes.js";
import settingsRoutes from "./settings/settings.routes.js";
import categoriesRoutes from "./categories/categories.routes.js";
import menuItemsRoutes from "./menu-items/menu-items.routes.js";
import orderSourcesRoutes from "./order-sources/order-sources.routes.js";
import ordersRoutes from "./orders/orders.routes.js";
import dashboardRoutes from "./dashboard/dashboard.routes.js";

const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({
    data: {
      service: "serveflow-api",
      status: "ok",
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    }
  });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/public", publicRoutes);
apiRouter.use(authenticate, asyncHandler(ensureActiveAccount));
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/categories", categoriesRoutes);
apiRouter.use("/menu-items", menuItemsRoutes);
apiRouter.use("/order-sources", orderSourcesRoutes);
apiRouter.use("/orders", ordersRoutes);
apiRouter.use("/dashboard", dashboardRoutes);

export default apiRouter;
