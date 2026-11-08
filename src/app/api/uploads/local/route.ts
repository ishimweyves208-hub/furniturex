import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { uploadLocalFile } from "@/lib/storage/local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser({ roles: ["seller", "superadmin"] });
    if (user.role === "seller" && user.sellerStatus === "suspended") {
      throw ApiError.forbidden("Your seller account is suspended.");
    }
    enforceRateLimit(`upload-local:${user.id}`, {
      limit: 60,
      windowMs: 10 * 60 * 1000,
      message: "Too many uploads. Please try again shortly.",
    });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      throw ApiError.badRequest("No file provided.");
    }

    const result = await uploadLocalFile(file, user.id);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}