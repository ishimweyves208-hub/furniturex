import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { adminUserUpdateSchema } from "@/lib/validation/product";
import { adminUpdateUser, getUserDetail } from "@/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    const user = await getUserDetail(id);
    if (!user) throw ApiError.notFound("User not found.");
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    const input = adminUserUpdateSchema.parse(await parseJsonBody(request));
    return jsonOk({ user: await adminUpdateUser(actor, id, input) });
  } catch (error) {
    return jsonError(error);
  }
}
