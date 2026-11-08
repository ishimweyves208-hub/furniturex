import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireActiveSeller } from "@/lib/auth/session";
import { productUpdateSchema } from "@/lib/validation/product";
import {
  deleteOrArchiveProduct,
  getSellerProduct,
  updateProduct,
} from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireActiveSeller();
    const { id } = await params;
    const product = await getSellerProduct(user.id, id);
    if (!product) throw ApiError.notFound("Product not found.");
    return jsonOk({ product });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireActiveSeller();
    const { id } = await params;
    const input = productUpdateSchema.parse(await parseJsonBody(request));
    return jsonOk({ product: await updateProduct(user.id, id, input) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireActiveSeller();
    const { id } = await params;
    return jsonOk(await deleteOrArchiveProduct(user.id, id));
  } catch (error) {
    return jsonError(error);
  }
}
