import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB: z.string().min(1).default("furniturex"),
  AUTH_SECRET: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Parses environment variables lazily (never at module import) so that
 * `next build` can type-check and prerender static routes without secrets.
 */
export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function requireEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = env()[key];
  if (value === undefined || value === null || value === "") {
    throw new ConfigurationError(
      `Missing required environment variable ${String(key)}. See .env.example.`,
    );
  }
  return value as NonNullable<ServerEnv[K]>;
}

export class ConfigurationError extends Error {
  readonly code = "CONFIGURATION_REQUIRED";
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export const isTest = () => env().NODE_ENV === "test";
export const isProduction = () => env().NODE_ENV === "production";

export function emailConfig() {
  const e = env();
  return {
    configured: Boolean(e.RESEND_API_KEY && e.EMAIL_FROM),
    apiKey: e.RESEND_API_KEY,
    from: e.EMAIL_FROM,
  };
}
