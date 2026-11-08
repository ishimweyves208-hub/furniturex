import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { updateOrderStatus } from "@/services/orders";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ note: z.string().trim().max(500).optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { id } = await params;
    const body = await parseJsonBody<unknown>(request).catch(() => ({}));
    const input = schema.parse(body);
    const order = await updateOrderStatus(
      { id: user.id, email: user.email, role: user.role },
      id,
      "cancelled",
      input.note,
    );
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error);
  }
}
