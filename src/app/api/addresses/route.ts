import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { addressInputSchema } from "@/lib/validation/product";
import { createAddress, listAddresses } from "@/services/addresses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk({ addresses: await listAddresses(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = addressInputSchema.parse(await parseJsonBody(request));
    return jsonOk({ address: await createAddress(user.id, input) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
