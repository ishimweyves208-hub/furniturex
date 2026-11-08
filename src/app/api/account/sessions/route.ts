import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { listActiveSessions, revokeSession } from "@/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk({ sessions: await listActiveSessions(user.id), current: user.sessionId });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");
    if (!sessionId) {
      return jsonOk({ revoked: false });
    }
    await revokeSession(user.id, sessionId);
    return jsonOk({ revoked: true });
  } catch (error) {
    return jsonError(error);
  }
}
