import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Peppered token hash. A database leak alone does not permit token forgery
 * because the HMAC key lives only in the server environment.
 */
export function hashToken(token: string): string {
  return createHmac("sha256", requireEnv("AUTH_SECRET")).update(token).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0 || a.length % 2 !== 0) return false;
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function resetTokenExpiry(hours = 1): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function verificationTokenExpiry(hours = 48): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
