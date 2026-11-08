import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import { Wishlist } from "@/models/Wishlist";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import { PUBLIC_PRODUCT_STATUS } from "@/lib/constants";
import { toProductDTO } from "@/services/products";
import type { ProductDTO } from "@/types";

export async function listWishlist(userId: string): Promise<ProductDTO[]> {
  await connectDb();
  const items = await Wishlist.find({ userId }).sort({ createdAt: -1 }).lean();
  if (items.length === 0) return [];
  const products = await Product.find({
    _id: { $in: items.map((item) => item.productId) },
    status: PUBLIC_PRODUCT_STATUS,
  }).lean();
  const sellerIds = [...new Set(products.map((product) => String(product.sellerId)))];
  const categoryIds = [...new Set(products.map((product) => String(product.categoryId)))];
  const [sellers, categories] = await Promise.all([
    User.find({ _id: { $in: sellerIds } }).lean(),
    Category.find({ _id: { $in: categoryIds } }).lean(),
  ]);
  const sellerMap = new Map(sellers.map((seller) => [String(seller._id), seller]));
  const categoryMap = new Map(categories.map((category) => [String(category._id), category]));
  const order = new Map(items.map((item, index) => [String(item.productId), index]));
  return products
    .sort(
      (a, b) => (order.get(String(a._id)) ?? 99) - (order.get(String(b._id)) ?? 99),
    )
    .map((product) =>
      toProductDTO(
        product,
        categoryMap.get(String(product.categoryId)),
        sellerMap.get(String(product.sellerId)),
      ),
    );
}

export async function getWishlistIds(userId: string, productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();
  await connectDb();
  const items = await Wishlist.find({ userId, productId: { $in: productIds } })
    .select("productId")
    .lean();
  return new Set(items.map((item) => String(item.productId)));
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  await connectDb();
  await Wishlist.deleteOne({ userId, productId });
}

export async function toggleWishlist(
  userId: string,
  productId: string,
): Promise<{ wished: boolean }> {
  await connectDb();
  if (!Types.ObjectId.isValid(productId)) throw ApiError.notFound("Product not found.");
  const product = await Product.findOne({ _id: productId, status: PUBLIC_PRODUCT_STATUS })
    .select("_id")
    .lean();
  if (!product) throw ApiError.notFound("Product not found.");
  const existing = await Wishlist.findOne({ userId, productId });
  if (existing) {
    await existing.deleteOne();
    return { wished: false };
  }
  try {
    await Wishlist.create({ userId, productId });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return { wished: true };
    }
    throw error;
  }
  return { wished: true };
}
