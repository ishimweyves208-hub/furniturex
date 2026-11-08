import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { commentInputSchema } from "@/lib/validation/product";
import { addComment, listProductComments } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) throw ApiError.badRequest("A productId query parameter is required.");
    return jsonOk({ comments: await listProductComments(productId) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(`comment:${user.id}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: "You are commenting too frequently. Please slow down.",
    });
    const input = commentInputSchema.parse(await parseJsonBody(request));
    return jsonOk({ comment: await addComment(user.id, input) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
