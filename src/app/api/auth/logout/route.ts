import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { clearSessionCookie, revokeSessionByToken } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) {
      await revokeSessionByToken(token).catch((error: unknown) => {
        console.error("[auth] failed to revoke session", error);
      });
    }
    await clearSessionCookie();
    return jsonOk({ signedOut: true });
  } catch (error) {
    return jsonError(error);
  }
}
