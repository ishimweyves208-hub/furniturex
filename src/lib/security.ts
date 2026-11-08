import { ApiError } from "@/lib/api";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Defence-in-depth CSRF check for cookie-authenticated mutations.
 * SameSite=Lax cookies already block most cross-site form posts, and this
 * additionally rejects requests whose Origin/Sec-Fetch-Site disagree with us.
 */
export function assertSameOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method)) return;

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    throw ApiError.forbidden("Cross-site requests are not allowed.");
  }

  if (!origin) {
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
      throw ApiError.forbidden("Request origin could not be verified.");
    }
    return;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw ApiError.forbidden("Request origin is invalid.");
  }

  if (host && originHost !== host) {
    throw ApiError.forbidden("Request origin does not match this site.");
  }
}

export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}

type Bucket = { count: number; resetAt: number };

declare global {
  var __furniturexRateLimits: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> =
  global.__furniturexRateLimits ?? (global.__furniturexRateLimits = new Map());

/**
 * Fixed-window in-memory limiter. This protects a single server instance.
 * In a horizontally scaled deployment, pair it with Cloudflare WAF rate
 * limiting rules.
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.limit - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  existing.count += 1;
  const allowed = existing.count <= options.limit;
  return {
    allowed,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function enforceRateLimit(
  key: string,
  options: { limit: number; windowMs: number; message?: string },
): void {
  const result = rateLimit(key, options);
  if (!result.allowed) {
    throw ApiError.rateLimited(
      options.message ?? `Too many attempts. Please try again in ${result.retryAfterSeconds}s.`,
    );
  }
}
