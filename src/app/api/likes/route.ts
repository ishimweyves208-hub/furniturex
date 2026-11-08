import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { likeSchema } from "@/lib/validation/product";
import { toggleLike } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(`like:${user.id}`, { limit: 60, windowMs: 60 * 1000 });
    const input = likeSchema.parse(await parseJsonBody(request));
    return jsonOk(await toggleLike(user.id, input.productId));
  } catch (error) {
    return jsonError(error);
  }
}
