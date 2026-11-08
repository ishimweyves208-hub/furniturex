import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { wishlistSchema } from "@/lib/validation/product";
import { listWishlist, removeFromWishlist, toggleWishlist } from "@/services/wishlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk({ items: await listWishlist(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = wishlistSchema.parse(await parseJsonBody(request));
    return jsonOk(await toggleWishlist(user.id, input.productId));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = wishlistSchema.parse(await parseJsonBody(request));
    await removeFromWishlist(user.id, input.productId);
    return jsonOk({ wished: false });
  } catch (error) {
    return jsonError(error);
  }
}
