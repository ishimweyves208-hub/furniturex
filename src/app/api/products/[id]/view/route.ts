import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, getClientIp } from "@/lib/security";
import { getCurrentUser } from "@/lib/auth/session";
import { recordProductView } from "@/services/products";
import { VIEWER_COOKIE, VIEWER_COOKIE_MAX_AGE } from "@/lib/constants";
import { isProduction } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`view:${getClientIp(request)}`, { limit: 120, windowMs: 60 * 1000 });
    const { id } = await params;
    const user = await getCurrentUser();
    let viewerKey = user?.id;
    if (!viewerKey) {
      const store = await cookies();
      viewerKey = store.get(VIEWER_COOKIE)?.value;
      if (!viewerKey) {
        viewerKey = randomUUID();
        store.set(VIEWER_COOKIE, viewerKey, {
          httpOnly: true,
          secure: isProduction(),
          sameSite: "lax",
          path: "/",
          maxAge: VIEWER_COOKIE_MAX_AGE,
        });
      }
    }
    await recordProductView(id, viewerKey, user?.id);
    return jsonOk({ recorded: true });
  } catch (error) {
    return jsonError(error);
  }
}
