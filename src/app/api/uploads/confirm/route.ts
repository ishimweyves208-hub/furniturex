import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { uploadConfirmSchema } from "@/lib/validation/product";
import { verifyLocalFile, getUploadUrl } from "@/lib/storage/local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser({ roles: ["seller", "superadmin"] });
    if (user.role === "seller" && user.sellerStatus === "suspended") {
      throw ApiError.forbidden("Your seller account is suspended.");
    }
    const input = uploadConfirmSchema.parse(await parseJsonBody(request));
    const head = await verifyLocalFile(input.key);
    if (!head.exists) {
      throw ApiError.badRequest("The uploaded file could not be found. Please upload it again.");
    }
    return jsonOk({
      key: input.key,
      url: getUploadUrl(input.key),
      size: head.size,
      contentType: "image/" + input.key.split(".").pop(),
    });
  } catch (error) {
    return jsonError(error);
  }
}