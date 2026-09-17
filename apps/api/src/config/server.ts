import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { EnvConfig } from "./env.js";

export async function buildServer(config: EnvConfig) {
  const server = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
      transport:
        config.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } }
          : undefined,
    },
  });

  // Security
  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  // CORS
  await server.register(cors, {
    origin: config.NODE_ENV === "production" ? false : true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Health check
  server.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  }));

  return server;
}
