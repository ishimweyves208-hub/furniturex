import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { categoryInputSchema } from "@/lib/validation/product";
import { createCategory, listCategoriesWithCounts } from "@/services/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    return jsonOk({ categories: await listCategoriesWithCounts() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser({ roles: ["superadmin"] });
    const input = categoryInputSchema.parse(await parseJsonBody(request));
    return jsonOk({ category: await createCategory(actor, input) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
