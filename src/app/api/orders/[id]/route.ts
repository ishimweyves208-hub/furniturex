import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { getCustomerOrder } from "@/services/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const order = await getCustomerOrder(user.id, id);
    if (!order) throw ApiError.notFound("Order not found.");
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error);
  }
}
