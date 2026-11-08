import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireActiveSeller } from "@/lib/auth/session";
import { shopProfileSchema } from "@/lib/validation/auth";
import { updateShopProfile } from "@/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireActiveSeller();
    const input = shopProfileSchema.parse(await parseJsonBody(request));
    await updateShopProfile(user.id, input);
    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}
