import type { NextRequest } from "next/server";
import { jsonError, jsonOk, getPagination } from "@/lib/api";
import { listPublicProducts } from "@/services/products";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = getPagination(searchParams);
    const sortParam = searchParams.get("sort");
    const sort = PRODUCT_SORTS.includes(sortParam as ProductSort)
      ? (sortParam as ProductSort)
      : "newest";
    const minPrice = Number.parseFloat(searchParams.get("minPrice") ?? "");
    const maxPrice = Number.parseFloat(searchParams.get("maxPrice") ?? "");
    const result = await listPublicProducts({
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      seller: searchParams.get("seller") ?? undefined,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      availability: searchParams.get("availability") ?? undefined,
      featured: searchParams.get("featured") === "true" || undefined,
      sort,
      page,
      pageSize,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
