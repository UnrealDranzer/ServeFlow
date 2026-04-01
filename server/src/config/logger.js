import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "passwordHash",
      "accessToken",
      "refreshToken",
      "refreshTokenHash"
    ],
    censor: "[Redacted]"
  },
  formatters: {
    level(label) {
      return { level: label };
    }
  }
});

export const httpLogger = pinoHttp({
  logger,
  customProps(req) {
    return { requestId: req.requestId };
  },
  serializers: {
    req(req) {
      return {
        id: req.requestId,
        method: req.method,
        url: req.url,
        remoteAddress: req.ip
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});
