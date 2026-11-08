import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { moderationSchema } from "@/lib/validation/product";
import { moderateProduct } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiUser({ roles: ["superadmin"] });
    const { id } = await params;
    const input = moderationSchema.parse(await parseJsonBody(request));
    return jsonOk({ product: await moderateProduct(admin, id, input) });
  } catch (error) {
    return jsonError(error);
  }
}
