import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser({ roles: ["seller", "superadmin"] });
    if (user.role === "seller" && user.sellerStatus === "suspended") {
      throw ApiError.forbidden("Your seller account is suspended.");
    }
    enforceRateLimit(`upload-sign:${user.id}`, {
      limit: 60,
      windowMs: 10 * 60 * 1000,
      message: "Too many uploads. Please try again shortly.",
    });
    await parseJsonBody(request);
    return jsonOk({
      uploadUrl: `/api/uploads/local`,
      key: "",
      publicUrl: "",
      expiresIn: 300,
    });
  } catch (error) {
    return jsonError(error);
  }
}