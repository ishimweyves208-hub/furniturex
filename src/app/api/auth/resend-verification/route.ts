import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { resendVerificationEmail } from "@/services/auth";
import { emailConfig } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    if (!emailConfig().configured) {
      throw new ApiError(
        503,
        "CONFIGURATION_REQUIRED",
        "Email delivery is not configured. Please contact support.",
      );
    }
    enforceRateLimit(`resend-verification:${user.id}`, {
      limit: 3,
      windowMs: 60 * 60 * 1000,
      message: "Please wait before requesting another verification email.",
    });
    const result = await resendVerificationEmail(user.id);
    return jsonOk({ sent: result.sent });
  } catch (error) {
    return jsonError(error);
  }
}
