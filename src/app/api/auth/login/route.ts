import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, getClientIp } from "@/lib/security";
import { loginSchema } from "@/lib/validation/auth";
import { loginUser } from "@/services/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { emailConfig } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const email = typeof body.email === "string" ? body.email.toLowerCase().slice(0, 254) : "unknown";
    enforceRateLimit(`login:${ip}:${email}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many sign-in attempts. Please try again in a few minutes.",
    });
    const input = loginSchema.parse(body);
    const result = await loginUser(input, {
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await setSessionCookie(result.token, result.expiresAt);
    return jsonOk({
      user: result.user,
      emailConfigured: emailConfig().configured,
    });
  } catch (error) {
    return jsonError(error);
  }
}
