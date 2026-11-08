import type { MetadataRoute } from "next";
import { connectDb } from "@/lib/db/connect";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/marketplace",
  "/sellers",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/marketplace" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/marketplace" ? 0.9 : 0.6,
  }));

  try {
    await connectDb();
    const [products, categories, sellers] = await Promise.all([
      Product.find({ status: "approved" })
        .select("slug updatedAt")
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      Category.find({ active: true }).select("slug updatedAt").sort({ order: 1 }).lean(),
      User.find({ role: "seller", accountStatus: "active", sellerStatus: "active" })
        .select("shopSlug updatedAt")
        .sort({ updatedAt: -1 })
        .limit(2000)
        .lean(),
    ]);

    entries.push(
      ...categories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((product) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...sellers
        .filter((seller) => Boolean(seller.shopSlug))
        .map((seller) => ({
          url: `${baseUrl}/shop/${seller.shopSlug}`,
          lastModified: seller.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
    );
  } catch {
    return entries;
  }

  return entries;
}
