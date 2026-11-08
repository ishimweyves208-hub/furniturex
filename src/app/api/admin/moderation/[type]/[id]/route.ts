import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { setCommentVisibility, setReviewVisibility } from "@/services/products";
import { recordAudit } from "@/services/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ visible: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser({ roles: ["superadmin"] });
    const { type, id } = await params;
    if (type !== "comments" && type !== "reviews") {
      throw ApiError.notFound("Unknown moderation resource.");
    }
    const input = schema.parse(await parseJsonBody(request));
    if (type === "comments") {
      await setCommentVisibility(id, input.visible);
    } else {
      await setReviewVisibility(id, input.visible);
    }
    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: `${type.slice(0, -1)}.visibility_changed`,
      targetType: type.slice(0, -1),
      targetId: id,
      metadata: { visible: input.visible },
    });
    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}
