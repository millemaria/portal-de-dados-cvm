import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

// Auto-load .env if available in environment
if (typeof process.loadEnvFile === "function") {
  for (const envPath of [".env", "../.env", "../../.env"]) {
    const resolved = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(resolved)) {
      try {
        process.loadEnvFile(resolved);
      } catch {
        // ignore if already loaded or syntax issues
      }
    }
  }
}

const envSchema = z.object({
  // Databricks
  DATABRICKS_HOST: z.string().url().optional(),
  DATABRICKS_TOKEN: z.string().min(1).optional(),
  DATABRICKS_WAREHOUSE_ID: z.string().min(1).optional(),
  DATABRICKS_CATALOG: z.string().default("portal_cvm"),
  DATABRICKS_SCHEMA: z.string().default("gold"),

  // Server
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_HOST: z.string().default("127.0.0.1"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Feature flags
  USE_MOCK_DATA: z
    .string()
    .transform((val) => val === "true")
    .default("true"),

  // Cache
  CACHE_TTL: z.coerce.number().int().min(0).default(300),

  // Auth
  JWT_SECRET: z
    .string()
    .default("portal-cvm-admin-secret-key-production-change-in-env"),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    throw new Error("Invalid environment configuration");
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/** Reset cached config (useful for testing) */
export function resetConfig(): void {
  cachedConfig = null;
}
