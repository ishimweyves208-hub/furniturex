import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { addressInputSchema } from "@/lib/validation/product";
import { deleteAddress, updateAddress } from "@/services/addresses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { id } = await params;
    const input = addressInputSchema.parse(await parseJsonBody(request));
    return jsonOk({ address: await updateAddress(user.id, id, input) });
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
    const user = await requireApiUser();
    const { id } = await params;
    await deleteAddress(user.id, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
