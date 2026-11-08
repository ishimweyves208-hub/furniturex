import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireActiveSeller } from "@/lib/auth/session";
import { productInputSchema } from "@/lib/validation/product";
import { createProduct, getSellerProducts } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireActiveSeller();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    return jsonOk(
      await getSellerProducts(user.id, {
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

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireActiveSeller();
    enforceRateLimit(`product-create:${user.id}`, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
      message: "Too many listings created. Please try again later.",
    });
    const input = productInputSchema.parse(await parseJsonBody(request));
    const product = await createProduct(user.id, input);
    return jsonOk({ product }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
