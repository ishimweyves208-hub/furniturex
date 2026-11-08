import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireActiveSeller } from "@/lib/auth/session";
import { orderStatusSchema } from "@/lib/validation/product";
import { getSellerOrder, updateOrderStatus } from "@/services/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireActiveSeller();
    const { id } = await params;
    const order = await getSellerOrder(user.id, id);
    if (!order) throw ApiError.notFound("Order not found.");
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireActiveSeller();
    const { id } = await params;
    const input = orderStatusSchema.parse(await parseJsonBody(request));
    const order = await updateOrderStatus(
      { id: user.id, email: user.email, role: user.role },
      id,
      input.status,
      input.note,
    );
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error);
  }
}
