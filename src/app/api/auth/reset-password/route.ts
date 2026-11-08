import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, getClientIp } from "@/lib/security";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { resetPasswordWithToken } from "@/services/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`reset:${getClientIp(request)}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
      message: "Too many password reset attempts. Please try again later.",
    });
    const input = resetPasswordSchema.parse(await parseJsonBody(request));
    await resetPasswordWithToken(input);
    return jsonOk({ reset: true });
  } catch (error) {
    return jsonError(error);
  }
}
