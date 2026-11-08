import { ApiError, jsonError, jsonOk } from "@/lib/api";
import {
  getPublicProductBySlug,
  listProductComments,
  listProductReviews,
} from "@/services/products";
import { getCurrentUser } from "@/lib/auth/session";
import { getLikedProductIds } from "@/services/products";
import { getWishlistIds } from "@/services/wishlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await getPublicProductBySlug(id);
    if (!product) {
      throw ApiError.notFound("Product not found.");
    }
    const [comments, reviews] = await Promise.all([
      listProductComments(product.id),
      listProductReviews(product.id),
    ]);
    const user = await getCurrentUser();
    const [likedIds, wishedIds] = user
      ? await Promise.all([
          getLikedProductIds(user.id, [product.id]),
          getWishlistIds(user.id, [product.id]),
        ])
      : [new Set<string>(), new Set<string>()];
    return jsonOk({
      product,
      comments,
      reviews,
      liked: likedIds.has(product.id),
      wished: wishedIds.has(product.id),
    });
  } catch (error) {
    return jsonError(error);
  }
}
