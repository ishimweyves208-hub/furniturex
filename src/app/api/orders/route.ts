import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validation/product";
import { createCheckout, listCustomerOrders } from "@/services/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const result = await listCustomerOrders(user.id, {
      page,
      pageSize: 10,
      status: searchParams.get("status") ?? undefined,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(`checkout:${user.id}`, {
      limit: 8,
      windowMs: 5 * 60 * 1000,
      message: "Too many checkout attempts. Please wait a moment and try again.",
    });
    const input = checkoutSchema.parse(await parseJsonBody(request));
    const result = await createCheckout(user.id, input);
    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
