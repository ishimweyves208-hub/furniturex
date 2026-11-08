import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { listAdminOrders } from "@/services/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    return jsonOk(
      await listAdminOrders({
        page,
        pageSize: 20,
        status: searchParams.get("status") ?? undefined,
        payment: searchParams.get("payment") ?? undefined,
        q: searchParams.get("q") ?? undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
