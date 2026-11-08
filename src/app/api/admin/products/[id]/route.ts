import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { getAdminProduct } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    const product = await getAdminProduct(id);
    if (!product) throw ApiError.notFound("Product not found.");
    return jsonOk({ product });
  } catch (error) {
    return jsonError(error);
  }
}
