import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { listPublicSellers } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellers = await listPublicSellers(searchParams.get("q") ?? undefined);
    return jsonOk({ sellers });
  } catch (error) {
    return jsonError(error);
  }
}
