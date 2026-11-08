import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { orderStatusSchema } from "@/lib/validation/product";
import { getAdminOrder, updateOrderStatus } from "@/services/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    const order = await getAdminOrder(id);
    if (!order) throw ApiError.notFound("Order not found.");
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    const input = orderStatusSchema.parse(await parseJsonBody(request));
    return jsonOk({
      order: await updateOrderStatus(
        { id: actor.id, email: actor.email, role: actor.role },
        id,
        input.status,
        input.note,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
