import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireActiveSeller } from "@/lib/auth/session";
import { getSellerAnalytics, getSellerOverview } from "@/services/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireActiveSeller();
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(Number.parseInt(searchParams.get("days") ?? "30", 10) || 30, 7), 180);
    const [overview, analytics] = await Promise.all([
      getSellerOverview(user.id),
      getSellerAnalytics(user.id, days),
    ]);
    return jsonOk({ overview, analytics });
  } catch (error) {
    return jsonError(error);
  }
}
