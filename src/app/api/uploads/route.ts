import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { deleteLocalFile, isManagedKey } from "@/lib/storage/local";
import { Product } from "@/models/Product";
import { connectDb } from "@/lib/db/connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser({ roles: ["seller", "superadmin"] });
    if (user.role === "seller" && user.sellerStatus === "suspended") {
      throw ApiError.forbidden("Your seller account is suspended.");
    }
    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!isManagedKey(key)) {
      throw ApiError.badRequest("Invalid storage key.");
    }
    await connectDb();
    const inUse = await Product.exists({ "images.key": key });
    if (inUse) {
      throw ApiError.badRequest("This image is in use by a listing and cannot be deleted.");
    }
    await deleteLocalFile(key);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}