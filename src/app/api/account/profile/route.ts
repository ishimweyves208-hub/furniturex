import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { profileSchema } from "@/lib/validation/auth";
import { updateProfile } from "@/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = profileSchema.parse(await parseJsonBody(request));
    await updateProfile(user.id, input);
    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}
