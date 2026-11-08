import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validation/auth";
import { changePassword } from "@/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(`password-change:${user.id}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      message: "Too many password change attempts. Please try again later.",
    });
    const input = changePasswordSchema.parse(await parseJsonBody(request));
    await changePassword(user.id, user.sessionId, input);
    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}
