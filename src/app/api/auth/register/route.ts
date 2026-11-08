import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, getClientIp } from "@/lib/security";
import { registerSchema } from "@/lib/validation/auth";
import { registerUser } from "@/services/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { emailConfig } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`register:${getClientIp(request)}`, {
      limit: 8,
      windowMs: 60 * 60 * 1000,
      message: "Too many registration attempts. Please try again later.",
    });
    const input = registerSchema.parse(await parseJsonBody(request));
    const { result, verificationEmailSent } = await registerUser(input, {
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await setSessionCookie(result.token, result.expiresAt);
    return jsonOk(
      {
        user: result.user,
        verificationEmailSent,
        emailConfigured: emailConfig().configured,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
