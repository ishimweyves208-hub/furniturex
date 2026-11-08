import type { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { cartItemSchema, cartUpdateSchema } from "@/lib/validation/product";
import { addToCart, getCart, removeCartItem, updateCartItem, clearCart } from "@/services/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk(await getCart(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(`cart-add:${user.id}`, { limit: 120, windowMs: 60 * 1000 });
    const input = cartItemSchema.parse(await parseJsonBody(request));
    return jsonOk(await addToCart(user.id, input.productId, input.quantity));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(`cart-update:${user.id}`, { limit: 120, windowMs: 60 * 1000 });
    const input = cartUpdateSchema.parse(await parseJsonBody(request));
    return jsonOk(await updateCartItem(user.id, input.productId, input.quantity));
  } catch (error) {
    return jsonError(error);
  }
}

const deleteSchema = z.object({ productId: z.string().optional() });

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const body = await request.json().catch(() => ({}));
    const input = deleteSchema.parse(body);
    if (input.productId) {
      return jsonOk(await removeCartItem(user.id, input.productId));
    }
    await clearCart(user.id);
    return jsonOk(await getCart(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
