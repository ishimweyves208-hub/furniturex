import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { categoryInputSchema } from "@/lib/validation/product";
import { deleteCategory, updateCategory } from "@/services/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    const input = categoryInputSchema.parse(await parseJsonBody(request));
    return jsonOk({ category: await updateCategory(actor, id, input) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    await deleteCategory(actor, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
