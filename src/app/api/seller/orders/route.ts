import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireActiveSeller } from "@/lib/auth/session";
import { listSellerOrders } from "@/services/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireActiveSeller();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    return jsonOk(
      await listSellerOrders(user.id, {
        page,
        pageSize: 20,
        status: searchParams.get("status") ?? undefined,
        q: searchParams.get("q") ?? undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
