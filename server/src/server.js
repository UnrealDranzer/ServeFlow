import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./db/prisma.js";

let server;

async function shutdown(signal) {
  logger.info({ signal }, "Shutting down ServeFlow API.");

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await prisma.$disconnect();
}

async function start() {
  await prisma.$connect();

  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "ServeFlow API is listening.");
  });
}

process.on("SIGINT", async () => {
  try {
    await shutdown("SIGINT");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Graceful shutdown failed on SIGINT.");
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  try {
    await shutdown("SIGTERM");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Graceful shutdown failed on SIGTERM.");
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection.");
});

process.on("uncaughtException", async (error) => {
  logger.fatal({ err: error }, "Uncaught exception.");

  try {
    await shutdown("uncaughtException");
  } finally {
    process.exit(1);
  }
});

start().catch(async (error) => {
  logger.fatal({ err: error }, "Failed to start ServeFlow API.");

  try {
    await prisma.$disconnect();
  } finally {
    process.exit(1);
  }
});
