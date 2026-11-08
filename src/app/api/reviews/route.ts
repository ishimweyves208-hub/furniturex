import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { reviewInputSchema } from "@/lib/validation/product";
import { createReview } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(`review:${user.id}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      message: "You are submitting reviews too frequently.",
    });
    const input = reviewInputSchema.parse(await parseJsonBody(request));
    return jsonOk({ review: await createReview(user.id, input) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
