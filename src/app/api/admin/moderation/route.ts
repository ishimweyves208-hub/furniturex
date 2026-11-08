import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { getReviewModerationQueue } from "@/services/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1),
      200,
    );
    return jsonOk(await getReviewModerationQueue(limit));
  } catch (error) {
    return jsonError(error);
  }
}
