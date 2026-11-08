import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, getClientIp } from "@/lib/security";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/services/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`forgot:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      message: "Too many password recovery requests. Please try again later.",
    });
    const input = forgotPasswordSchema.parse(await parseJsonBody(request));
    await requestPasswordReset(input.email);
    return jsonOk({
      message:
        "If an account exists for that email, a password reset link has been sent. The link expires in one hour.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
