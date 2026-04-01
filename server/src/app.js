import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { httpLogger } from "./config/logger.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { requestContext } from "./middlewares/request-context.js";
import { apiLimiter } from "./middlewares/rate-limiters.js";
import apiRouter from "./modules/index.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY);

app.use(requestContext);
app.use(httpLogger);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT }));
app.use(cookieParser());

app.get("/health", (req, res) => {
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

app.use("/api", apiLimiter, apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
