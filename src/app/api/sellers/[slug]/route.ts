import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getSellerShopBySlug } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const shop = await getSellerShopBySlug(slug);
    if (!shop) throw ApiError.notFound("Seller not found.");
    return jsonOk(shop);
  } catch (error) {
    return jsonError(error);
  }
}
