import { createHash } from "node:crypto";
import { Types } from "mongoose";
import type { QueryFilter } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import {
  PRODUCT_STATUSES,
  PUBLIC_PRODUCT_STATUS,
  type ProductSort,
  type ProductStatus,
} from "@/lib/constants";
import type { ICategory } from "@/models/Category";
import type { IProduct } from "@/models/Product";
import type { IUser } from "@/models/User";
import type { ProductDTO, CategoryDTO, SellerPublicDTO, Paginated, CommentDTO, ReviewDTO } from "@/types";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { Comment } from "@/models/Comment";
import { Review } from "@/models/Review";
import { ProductView } from "@/models/ProductView";
import { ProductEvent } from "@/models/ProductEvent";
import { Wishlist } from "@/models/Wishlist";
import { Cart } from "@/models/Cart";
import { Order } from "@/models/Order";
import { notify, notifyMany } from "@/services/notifications";
import { getPlatformSettings } from "@/services/settings";
import { recordAudit } from "@/services/audit";

function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value);
}
import { deleteLocalFile, isManagedKey } from "@/lib/storage/local";
import type { z } from "zod";
import type { productInputSchema } from "@/lib/validation/product";
import type { moderationSchema } from "@/lib/validation/product";

type ProductInput = z.infer<typeof productInputSchema>;
type ModerationInput = z.infer<typeof moderationSchema>;

type LeanProduct = IProduct & { _id: Types.ObjectId };
type LeanUser = IUser & { _id: Types.ObjectId };
type LeanCategory = ICategory & { _id: Types.ObjectId };

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function showDemoCatalog(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_PRODUCTS === "true";
}

function publicProductStatusMatch(): Record<string, unknown> {
  return showDemoCatalog()
    ? { status: PUBLIC_PRODUCT_STATUS }
    : { status: PUBLIC_PRODUCT_STATUS, isDemo: { $ne: true } };
}

function sellerPublic(user: LeanUser): SellerPublicDTO {
  return {
    id: String(user._id),
    name: user.name,
    shopName: user.shopName ?? user.name,
    shopSlug: user.shopSlug ?? String(user._id),
    shopDescription: user.shopDescription,
    shopLogo: user.shopLogo ?? user.avatar,
    memberSince: user.createdAt.toISOString(),
  };
}

function categoryPublic(category: LeanCategory): CategoryDTO {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    order: category.order,
    active: category.active,
  };
}

export function toProductDTO(
  product: LeanProduct,
  category?: LeanCategory | null,
  seller?: LeanUser | null,
): ProductDTO {
  const images = [...product.images]
    .map((image, index) => ({
      url: image.url,
      key: image.key,
      alt: image.alt ?? product.name,
      isPrimary: Boolean(image.isPrimary) || index === 0,
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceCents: product.priceCents,
    currency: product.currency,
    images,
    primaryImage: images[0]?.url,
    materials: product.materials ?? [],
    dimensions: product.dimensions
      ? {
          width: product.dimensions.width,
          depth: product.dimensions.depth,
          height: product.dimensions.height,
          unit: product.dimensions.unit,
        }
      : undefined,
    color: product.color,
    stock: product.stock,
    status: product.status,
    moderationReason: product.moderationReason,
    isFeatured: product.isFeatured,
    isDemo: Boolean(product.isDemo),
    viewCount: product.viewCount,
    uniqueViewCount: product.uniqueViewCount,
    likeCount: product.likeCount,
    commentCount: product.commentCount,
    cartAddCount: product.cartAddCount,
    orderCount: product.orderCount,
    salesCount: product.salesCount,
    revenueCents: product.revenueCents,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    category: category
      ? { id: String(category._id), name: category.name, slug: category.slug }
      : undefined,
    seller: seller ? sellerPublic(seller) : undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null,
  };
}

async function hydrateProducts(products: LeanProduct[]): Promise<ProductDTO[]> {
  if (products.length === 0) return [];
  const sellerIds = [...new Set(products.map((p) => String(p.sellerId)))];
  const categoryIds = [...new Set(products.map((p) => String(p.categoryId)))];
  const [sellers, categories] = await Promise.all([
    User.find({ _id: { $in: sellerIds } }).lean<LeanUser[]>(),
    Category.find({ _id: { $in: categoryIds } }).lean<LeanCategory[]>(),
  ]);
  const sellerMap = new Map(sellers.map((s) => [String(s._id), s]));
  const categoryMap = new Map(categories.map((c) => [String(c._id), c]));
  return products.map((product) =>
    toProductDTO(
      product,
      categoryMap.get(String(product.categoryId)),
      sellerMap.get(String(product.sellerId)),
    ),
  );
}

export interface ProductQuery {
  q?: string;
  category?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  featured?: boolean;
}

export async function listPublicProducts(
  params: ProductQuery,
): Promise<Paginated<ProductDTO>> {
  await connectDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(Math.max(params.pageSize ?? 12, 1), 60);
  const filter: QueryFilter<IProduct> = { status: PUBLIC_PRODUCT_STATUS };
  if (!showDemoCatalog()) filter.isDemo = { $ne: true };

  if (params.q) {
    const pattern = new RegExp(escapeRegex(params.q.slice(0, 120)), "i");
    filter.$or = [{ name: pattern }, { description: pattern }, { materials: pattern }];
  }

  if (params.category) {
    const category = await Category.findOne({ slug: params.category, active: true })
      .select("_id")
      .lean();
    if (!category) return { items: [], page, pageSize, total: 0, totalPages: 0 };
    filter.categoryId = category._id;
  }

  if (params.seller) {
    const seller = await User.findOne({ shopSlug: params.seller, role: "seller" })
      .select("_id")
      .lean();
    if (!seller) return { items: [], page, pageSize, total: 0, totalPages: 0 };
    filter.sellerId = seller._id;
  }

  const priceFilter: { $gte?: number; $lte?: number } = {};
  if (typeof params.minPrice === "number" && Number.isFinite(params.minPrice)) {
    priceFilter.$gte = Math.round(params.minPrice * 100);
  }
  if (typeof params.maxPrice === "number" && Number.isFinite(params.maxPrice)) {
    priceFilter.$lte = Math.round(params.maxPrice * 100);
  }
  if (Object.keys(priceFilter).length > 0) filter.priceCents = priceFilter;
  if (params.availability === "in-stock") {
    filter.stock = { $gt: 0 };
  }
  if (params.featured) {
    filter.isFeatured = true;
  }

  const sortMap: Record<ProductSort, Record<string, 1 | -1>> = {
    newest: { publishedAt: -1, createdAt: -1 },
    "price-asc": { priceCents: 1 },
    "price-desc": { priceCents: -1 },
    popular: { viewCount: -1, salesCount: -1 },
  };
  const sort = sortMap[params.sort ?? "newest"] ?? sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanProduct[]>(),
    Product.countDocuments(filter),
  ]);

  return {
    items: await hydrateProducts(products),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPublicProductBySlug(slug: string): Promise<ProductDTO | null> {
  await connectDb();
  const filter: QueryFilter<IProduct> = { slug, status: PUBLIC_PRODUCT_STATUS };
  if (!showDemoCatalog()) filter.isDemo = { $ne: true };
  const product = await Product.findOne(filter).lean<LeanProduct>();
  if (!product) return null;
  const [seller, category] = await Promise.all([
    User.findById(product.sellerId).lean<LeanUser>(),
    Category.findById(product.categoryId).lean<LeanCategory>(),
  ]);
  return toProductDTO(product, category, seller);
}

export async function getRelatedProducts(product: ProductDTO, limit = 4): Promise<ProductDTO[]> {
  await connectDb();
  const filter: QueryFilter<IProduct> = {
    status: PUBLIC_PRODUCT_STATUS,
    _id: { $ne: new Types.ObjectId(product.id) },
  };
  if (!showDemoCatalog()) filter.isDemo = { $ne: true };
  if (product.category) filter.categoryId = new Types.ObjectId(product.category.id);
  let products = await Product.find(filter)
    .sort({ viewCount: -1 })
    .limit(limit)
    .lean<LeanProduct[]>();
  if (products.length < limit) {
    const extra = await Product.find({
      ...publicProductStatusMatch(),
      _id: { $nin: [new Types.ObjectId(product.id), ...products.map((p) => p._id)] },
    })
      .sort({ createdAt: -1 })
      .limit(limit - products.length)
      .lean<LeanProduct[]>();
    products = [...products, ...extra];
  }
  return hydrateProducts(products);
}

export async function listActiveCategories(): Promise<CategoryDTO[]> {
  await connectDb();
  const [categories, counts] = await Promise.all([
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean<LeanCategory[]>(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: publicProductStatusMatch() },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  return categories.map((category) => ({
    ...categoryPublic(category),
    productCount: countMap.get(String(category._id)) ?? 0,
  }));
}

export async function listAllCategories(): Promise<CategoryDTO[]> {
  await connectDb();
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean<LeanCategory[]>(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  return categories.map((category) => ({
    ...categoryPublic(category),
    productCount: countMap.get(String(category._id)) ?? 0,
  }));
}

export async function getFeaturedSellers(limit = 4): Promise<SellerPublicDTO[]> {
  await connectDb();
  const rows = await Product.aggregate<{
    _id: Types.ObjectId;
    productCount: number;
    totalViews: number;
  }>([
    { $match: { status: PUBLIC_PRODUCT_STATUS } },
    {
      $group: {
        _id: "$sellerId",
        productCount: { $sum: 1 },
        totalViews: { $sum: "$viewCount" },
      },
    },
    { $sort: { productCount: -1, totalViews: -1 } },
    { $limit: limit },
  ]);
  if (rows.length === 0) return [];
  const sellers = await User.find({
    _id: { $in: rows.map((row) => row._id) },
    role: "seller",
    accountStatus: "active",
  }).lean<LeanUser[]>();
  const map = new Map(sellers.map((seller) => [String(seller._id), seller]));
  return rows.flatMap((row) => {
    const seller = map.get(String(row._id));
    if (!seller) return [];
    return [
      {
        ...sellerPublic(seller),
        productCount: row.productCount,
        totalViews: row.totalViews,
      },
    ];
  });
}

export async function getHomepageCollections() {
  await connectDb();
  const [categories, marketplace, popular, featured, sellers] = await Promise.all([
    listActiveCategories().then((items) => items.slice(0, 8)),
    listPublicProducts({ sort: "newest", pageSize: 8 }),
    listPublicProducts({ sort: "popular", pageSize: 4 }),
    listPublicProducts({ sort: "newest", featured: true, pageSize: 3 }),
    getFeaturedSellers(4),
  ]);
  return {
    categories,
    marketplace: marketplace.items,
    newArrivals: marketplace.items.slice(0, 4),
    popular: popular.items,
    featured: featured.items.length > 0 ? featured.items : marketplace.items.slice(0, 3),
    sellers,
  };
}

export async function getSellerShopBySlug(slug: string): Promise<{
  seller: SellerPublicDTO;
  products: Paginated<ProductDTO>;
} | null> {
  await connectDb();
  const seller = await User.findOne({ shopSlug: slug, role: "seller" }).lean<LeanUser>();
  if (!seller) return null;
  const products = await listPublicProducts({ seller: slug, pageSize: 24 });
  const productCount = products.total;
  const totalViews = products.items.reduce((sum, item) => sum + item.viewCount, 0);
  return {
    seller: { ...sellerPublic(seller), productCount, totalViews },
    products,
  };
}

export async function listPublicSellers(search?: string): Promise<SellerPublicDTO[]> {
  await connectDb();
  const filter: QueryFilter<IUser> = { role: "seller", accountStatus: "active" };
  if (!showDemoCatalog()) filter.email = { $not: /@furniturex\.demo$/ };
  if (search) {
    const pattern = new RegExp(escapeRegex(search.slice(0, 80)), "i");
    filter.$or = [{ shopName: pattern }, { name: pattern }];
  }
  const sellers = await User.find(filter).sort({ createdAt: 1 }).limit(60).lean<LeanUser[]>();
  const counts = await Product.aggregate<{ _id: Types.ObjectId; count: number; views: number }>([
    { $match: publicProductStatusMatch() },
    { $group: { _id: "$sellerId", count: { $sum: 1 }, views: { $sum: "$viewCount" } } },
  ]);
  const map = new Map(counts.map((row) => [String(row._id), row]));
  return sellers.map((seller) => ({
    ...sellerPublic(seller),
    productCount: map.get(String(seller._id))?.count ?? 0,
    totalViews: map.get(String(seller._id))?.views ?? 0,
  }));
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || `piece-${Date.now().toString(36)}`;
  let candidate = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await Product.exists({ slug: candidate });
    if (!exists) return candidate;
    candidate = `${base}-${Math.random().toString(16).slice(2, 8)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function productContentHash(input: {
  name: string;
  description: string;
  categoryId: string;
  images: { url: string }[];
  materials: string[];
  dimensions?: { width?: number; depth?: number; height?: number; unit: string };
  color?: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        name: input.name.trim(),
        description: input.description.trim(),
        categoryId: input.categoryId,
        images: input.images.map((image) => image.url).sort(),
        materials: [...input.materials].map((m) => m.trim()).sort(),
        dimensions: input.dimensions ?? null,
        color: input.color?.trim() ?? "",
      }),
    )
    .digest("hex");
}

function normalizeMaterials(materials: ProductInput["materials"]): string[] {
  if (!materials) return [];
  const list = Array.isArray(materials) ? materials : materials.split(",");
  return [...new Set(list.map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

function normalizeImages(images: ProductInput["images"], name: string) {
  const normalized = images.slice(0, 8).map((image, index) => ({
    url: image.url,
    key: image.key,
    alt: image.alt || name,
    isPrimary: Boolean(image.isPrimary) || index === 0,
  }));
  const primaryCount = normalized.filter((image) => image.isPrimary).length;
  if (primaryCount !== 1) {
    return normalized.map((image, index) => ({ ...image, isPrimary: index === 0 }));
  }
  return normalized;
}

export function assertImageOwnership(sellerId: string, images: { key?: string; url: string }[]): void {
  for (const image of images) {
    if (!image.key) continue;
    if (!isManagedKey(image.key)) {
      throw ApiError.badRequest("One or more uploaded images are not valid.");
    }
    const expected = `/uploads/${image.key}`;
    if (image.url !== expected) {
      throw ApiError.badRequest("Image URL does not match the uploaded file.");
    }
  }
}

async function ensureCategory(categoryId: string): Promise<void> {
  const category = await Category.findOne({ _id: categoryId, active: true }).lean();
  if (!category) throw ApiError.badRequest("Select an active product category.");
}

export async function createProduct(
  sellerId: string,
  input: ProductInput,
): Promise<ProductDTO> {
  await connectDb();
  await ensureCategory(input.categoryId);
  assertImageOwnership(sellerId, input.images);
  const slug = await uniqueSlug(input.name);
  const materials = normalizeMaterials(input.materials);
  const images = normalizeImages(input.images, input.name);
  const submit = input.action === "submit";

  const product = await Product.create({
    sellerId,
    categoryId: input.categoryId,
    name: input.name,
    slug,
    description: input.description,
    priceCents: Math.round(input.price * 100),
    images,
    materials,
    dimensions: input.dimensions,
    color: input.color || undefined,
    stock: input.stock,
    status: submit ? "pending" : "draft",
    submittedAt: submit ? new Date() : null,
  });

  if (submit) {
    const admins = await User.find({ role: "superadmin", accountStatus: "active" })
      .select("_id")
      .lean();
    await notifyMany(
      admins.map((admin) => ({
        userId: admin._id,
        type: "product" as const,
        title: "New listing awaiting approval",
        message: `${product.name} was submitted for review.`,
        link: "/admin/approvals",
      })),
    );
  }

  const [category, seller] = await Promise.all([
    Category.findById(product.categoryId).lean<LeanCategory>(),
    User.findById(product.sellerId).lean<LeanUser>(),
  ]);
  return toProductDTO(product.toObject() as LeanProduct, category, seller);
}

export async function updateProduct(
  sellerId: string,
  productId: string,
  input: ProductInput,
): Promise<ProductDTO> {
  await connectDb();
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) throw ApiError.notFound("Product not found.");
  if (product.status === "suspended") {
    throw ApiError.forbidden("This listing is suspended and cannot be edited.");
  }
  await ensureCategory(input.categoryId);
  assertImageOwnership(sellerId, input.images);

  const settings = await getPlatformSettings();
  const materials = normalizeMaterials(input.materials);
  const images = normalizeImages(input.images, input.name);

  // Delete removed images from local storage
  const oldKeys = product.images.map((img) => img.key).filter((k): k is string => Boolean(k));
  const newKeys = images.map((img) => img.key).filter((k): k is string => Boolean(k));
  const removedKeys = oldKeys.filter((key) => !newKeys.includes(key));
  for (const key of removedKeys) {
    await deleteLocalFile(key);
  }

  const newHash = productContentHash({
    name: input.name,
    description: input.description,
    categoryId: input.categoryId,
    images,
    materials,
    dimensions: input.dimensions,
    color: input.color,
  });
  const previousHash =
    product.approvedContentHash ??
    productContentHash({
      name: product.name,
      description: product.description,
      categoryId: String(product.categoryId),
      images: product.images,
      materials: product.materials,
      dimensions: product.dimensions,
      color: product.color,
    });
  const materialChange = newHash !== previousHash;
  const submit = input.action === "submit";

  let nextStatus = product.status;
  let moderationReason = product.moderationReason;
  let submittedAt = product.submittedAt;

  if (product.status === "approved" && materialChange && settings.requireReapprovalOnMaterialChange) {
    nextStatus = "pending";
    moderationReason = "Listing content changed and is awaiting re-approval.";
    submittedAt = new Date();
  } else if (submit && ["draft", "rejected", "pending"].includes(product.status)) {
    nextStatus = "pending";
    moderationReason = undefined;
    submittedAt = new Date();
  } else if (!submit && ["draft", "rejected"].includes(product.status)) {
    nextStatus = "draft";
  }

  const shouldRefreshApprovedHash =
    product.status === "approved" &&
    materialChange &&
    !settings.requireReapprovalOnMaterialChange;

  product.set({
    name: input.name,
    categoryId: input.categoryId,
    description: input.description,
    priceCents: Math.round(input.price * 100),
    images,
    materials,
    dimensions: input.dimensions,
    color: input.color || undefined,
    stock: input.stock,
    status: nextStatus,
    moderationReason,
    submittedAt,
    ...(shouldRefreshApprovedHash ? { approvedContentHash: newHash } : {}),
  });
  await product.save();

  if (nextStatus === "pending") {
    const admins = await User.find({ role: "superadmin", accountStatus: "active" })
      .select("_id")
      .lean();
    await notifyMany(
      admins.map((admin) => ({
        userId: admin._id,
        type: "product" as const,
        title: "Listing resubmitted for review",
        message: `${product.name} was updated and needs approval.`,
        link: "/admin/approvals",
      })),
    );
  }

  const [category, seller] = await Promise.all([
    Category.findById(product.categoryId).lean<LeanCategory>(),
    User.findById(product.sellerId).lean<LeanUser>(),
  ]);
  return toProductDTO(product.toObject() as LeanProduct, category, seller);
}

export async function deleteOrArchiveProduct(
  sellerId: string,
  productId: string,
): Promise<{ archived: boolean }> {
  await connectDb();
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) throw ApiError.notFound("Product not found.");
  const orderCount = await Order.countDocuments({ "items.productId": product._id });
  if (orderCount > 0) {
    product.set({ status: "archived" });
    await product.save();
    return { archived: true };
  }
  // Delete associated image files from local storage
  const imageKeys = product.images.map((img) => img.key).filter((k): k is string => Boolean(k));
  for (const key of imageKeys) {
    await deleteLocalFile(key);
  }
  await Promise.all([
    Like.deleteMany({ productId: product._id }),
    Comment.deleteMany({ productId: product._id }),
    Review.deleteMany({ productId: product._id }),
    ProductView.deleteMany({ productId: product._id }),
    ProductEvent.deleteMany({ productId: product._id }),
    Wishlist.deleteMany({ productId: product._id }),
    Cart.updateMany({}, { $pull: { items: { productId: product._id } } }),
  ]);
  await product.deleteOne();
  return { archived: false };
}

export async function getSellerProducts(
  sellerId: string,
  options: { page?: number; pageSize?: number; status?: string; q?: string } = {},
): Promise<Paginated<ProductDTO>> {
  await connectDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 60);
  const filter: QueryFilter<IProduct> = { sellerId };
  if (options.status && options.status !== "all" && isProductStatus(options.status)) {
    filter.status = options.status;
  }
  if (options.q) {
    filter.name = new RegExp(escapeRegex(options.q.slice(0, 100)), "i");
  }
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanProduct[]>(),
    Product.countDocuments(filter),
  ]);
  return {
    items: await hydrateProducts(products),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSellerProduct(
  sellerId: string,
  productId: string,
): Promise<ProductDTO | null> {
  await connectDb();
  const product = await Product.findOne({ _id: productId, sellerId }).lean<LeanProduct>();
  if (!product) return null;
  const [category, seller] = await Promise.all([
    Category.findById(product.categoryId).lean<LeanCategory>(),
    User.findById(product.sellerId).lean<LeanUser>(),
  ]);
  return toProductDTO(product, category, seller);
}

export async function listAdminProducts(
  options: {
    page?: number;
    pageSize?: number;
    status?: string;
    q?: string;
    sellerId?: string;
    categoryId?: string;
  } = {},
): Promise<Paginated<ProductDTO>> {
  await connectDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 60);
  const filter: QueryFilter<IProduct> = {};
  if (options.status && options.status !== "all" && isProductStatus(options.status)) {
    filter.status = options.status;
  }
  if (options.sellerId && Types.ObjectId.isValid(options.sellerId)) {
    filter.sellerId = options.sellerId;
  }
  if (options.categoryId && Types.ObjectId.isValid(options.categoryId)) {
    filter.categoryId = options.categoryId;
  }
  if (options.q) {
    filter.name = new RegExp(escapeRegex(options.q.slice(0, 100)), "i");
  }
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanProduct[]>(),
    Product.countDocuments(filter),
  ]);
  return {
    items: await hydrateProducts(products),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAdminProduct(productId: string): Promise<ProductDTO | null> {
  await connectDb();
  if (!Types.ObjectId.isValid(productId)) return null;
  const product = await Product.findById(productId).lean<LeanProduct>();
  if (!product) return null;
  const [category, seller] = await Promise.all([
    Category.findById(product.categoryId).lean<LeanCategory>(),
    User.findById(product.sellerId).lean<LeanUser>(),
  ]);
  return toProductDTO(product, category, seller);
}

export async function moderateProduct(
  admin: { id: string; email: string },
  productId: string,
  input: ModerationInput,
): Promise<ProductDTO> {
  await connectDb();
  if ((input.action === "reject" || input.action === "request_changes") && !input.reason) {
    throw ApiError.badRequest("A reason is required when rejecting a listing.");
  }
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound("Product not found.");

  switch (input.action) {
    case "approve":
      product.set({
        status: "approved",
        moderationReason: undefined,
        approvedBy: admin.id,
        approvedAt: new Date(),
        moderatedAt: new Date(),
        publishedAt: product.publishedAt ?? new Date(),
        approvedContentHash: productContentHash({
          name: product.name,
          description: product.description,
          categoryId: String(product.categoryId),
          images: product.images,
          materials: product.materials,
          dimensions: product.dimensions,
          color: product.color,
        }),
      });
      break;
    case "reject":
      product.set({ status: "rejected", moderationReason: input.reason, moderatedAt: new Date() });
      break;
    case "request_changes":
      product.set({
        status: "rejected",
        moderationReason: `Changes requested: ${input.reason}`,
        moderatedAt: new Date(),
      });
      break;
    case "remove":
      product.set({
        status: "archived",
        moderationReason: input.reason || "Removed by platform administration.",
        moderatedAt: new Date(),
      });
      break;
    case "suspend":
      product.set({
        status: "suspended",
        moderationReason: input.reason || "Suspended by platform administration.",
        moderatedAt: new Date(),
      });
      break;
    case "restore":
      product.set({
        status: "pending",
        moderationReason: "Restored for re-review by platform administration.",
        moderatedAt: new Date(),
      });
      break;
  }
  await product.save();

  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: `product.${input.action}`,
    targetType: "product",
    targetId: String(product._id),
    metadata: { reason: input.reason ?? null, status: product.status },
  });

  const actionLabel =
    input.action === "approve"
      ? "approved"
      : input.action === "reject"
        ? "rejected"
        : input.action === "request_changes"
          ? "needs changes"
          : input.action === "remove"
            ? "removed"
            : input.action === "suspend"
              ? "suspended"
              : "restored";
  await notify({
    userId: product.sellerId,
    type: "product",
    title: `Listing ${actionLabel}`,
    message: input.reason
      ? `${product.name}: ${input.reason}`
      : `${product.name} was ${actionLabel} by the FurnitureX team.`,
    link: "/seller/products",
  });

  const [category, seller] = await Promise.all([
    Category.findById(product.categoryId).lean<LeanCategory>(),
    User.findById(product.sellerId).lean<LeanUser>(),
  ]);
  return toProductDTO(product.toObject() as LeanProduct, category, seller);
}

export async function recordProductView(
  productId: string,
  viewerKey: string,
  userId?: string | null,
): Promise<void> {
  await connectDb();
  if (!Types.ObjectId.isValid(productId)) return;
  const product = await Product.findOne({ _id: productId, status: PUBLIC_PRODUCT_STATUS })
    .select("_id sellerId")
    .lean();
  if (!product) return;

  let result;
  try {
    result = await ProductView.updateOne(
      { productId: product._id, viewerKey },
      {
        $set: { lastViewedAt: new Date(), userId: userId ?? null },
        $setOnInsert: { firstViewedAt: new Date(), sellerId: product.sellerId },
        $inc: { viewCount: 1 },
      },
      { upsert: true },
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      result = await ProductView.updateOne(
        { productId: product._id, viewerKey },
        { $set: { lastViewedAt: new Date(), userId: userId ?? null }, $inc: { viewCount: 1 } },
      );
    } else {
      throw error;
    }
  }

  const increments: Record<string, number> = { viewCount: 1 };
  if (result.upsertedCount > 0) increments.uniqueViewCount = 1;
  await Product.updateOne({ _id: product._id }, { $inc: increments });
  await ProductEvent.create({
    productId: product._id,
    sellerId: product.sellerId,
    type: "view",
    userId: userId ?? null,
    anonId: userId ? null : viewerKey,
  });
}

export async function toggleLike(
  userId: string,
  productId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  await connectDb();
  if (!Types.ObjectId.isValid(productId)) throw ApiError.notFound("Product not found.");
  const product = await Product.findOne({ _id: productId, status: PUBLIC_PRODUCT_STATUS })
    .select("_id sellerId name likeCount")
    .lean();
  if (!product) throw ApiError.notFound("Product not found.");

  const existing = await Like.findOne({ userId, productId });
  if (existing) {
    await existing.deleteOne();
    const updated = await Product.findByIdAndUpdate(
      productId,
      { $inc: { likeCount: -1 } },
      { returnDocument: "after", projection: { likeCount: 1 } },
    ).lean();
    return { liked: false, likeCount: Math.max(0, updated?.likeCount ?? 0) };
  }

  try {
    await Like.create({ userId, productId });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const current = await Product.findById(productId).select("likeCount").lean();
      return { liked: true, likeCount: current?.likeCount ?? 0 };
    }
    throw error;
  }
  const updated = await Product.findByIdAndUpdate(
    productId,
    { $inc: { likeCount: 1 } },
    { returnDocument: "after", projection: { likeCount: 1 } },
  ).lean();
  return { liked: true, likeCount: updated?.likeCount ?? 0 };
}

export async function getLikedProductIds(userId: string, productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();
  await connectDb();
  const likes = await Like.find({ userId, productId: { $in: productIds } })
    .select("productId")
    .lean();
  return new Set(likes.map((like) => String(like.productId)));
}

export async function addComment(
  userId: string,
  input: { productId: string; content: string },
): Promise<CommentDTO> {
  await connectDb();
  const product = await Product.findOne({ _id: input.productId, status: PUBLIC_PRODUCT_STATUS })
    .select("_id sellerId name slug")
    .lean();
  if (!product) throw ApiError.notFound("Product not found.");
  const comment = await Comment.create({
    productId: product._id,
    userId,
    content: input.content,
  });
  await Product.updateOne({ _id: product._id }, { $inc: { commentCount: 1 } });
  const author = await User.findById(userId).select("name avatar").lean();
  await notify({
    userId: product.sellerId,
    type: "comment",
    title: "New comment on your listing",
    message: `${author?.name ?? "A customer"} commented on ${product.name}.`,
    link: `/product/${product.slug}`,
  });
  return {
    id: String(comment._id),
    content: comment.content,
    status: "visible",
    createdAt: comment.createdAt.toISOString(),
    author: { id: userId, name: author?.name ?? "Customer", avatar: author?.avatar },
  };
}

export async function listProductComments(productId: string): Promise<CommentDTO[]> {
  await connectDb();
  const comments = await Comment.find({ productId, status: "visible" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const userIds = [...new Set(comments.map((comment) => String(comment.userId)))];
  const users = await User.find({ _id: { $in: userIds } })
    .select("name avatar")
    .lean();
  const map = new Map(users.map((user) => [String(user._id), user]));
  return comments.map((comment) => {
    const user = map.get(String(comment.userId));
    return {
      id: String(comment._id),
      content: comment.content,
      status: comment.status,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: String(comment.userId),
        name: user?.name ?? "Customer",
        avatar: user?.avatar,
      },
    };
  });
}

export async function listProductReviews(productId: string): Promise<ReviewDTO[]> {
  await connectDb();
  const reviews = await Review.find({ productId, status: "visible" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const userIds = [...new Set(reviews.map((review) => String(review.userId)))];
  const users = await User.find({ _id: { $in: userIds } })
    .select("name avatar")
    .lean();
  const map = new Map(users.map((user) => [String(user._id), user]));
  return reviews.map((review) => {
    const user = map.get(String(review.userId));
    return {
      id: String(review._id),
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt.toISOString(),
      author: {
        id: String(review.userId),
        name: user?.name ?? "Customer",
        avatar: user?.avatar,
      },
    };
  });
}

async function refreshProductRating(productId: Types.ObjectId): Promise<void> {
  const rows = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { productId, status: "visible" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const row = rows[0];
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        ratingAvg: row ? Math.round(row.avg * 10) / 10 : 0,
        ratingCount: row?.count ?? 0,
      },
    },
  );
}

export async function createReview(
  userId: string,
  input: { productId: string; orderId: string; rating: number; content: string },
): Promise<ReviewDTO> {
  await connectDb();
  const order = await Order.findOne({
    _id: input.orderId,
    customerId: userId,
    orderStatus: "delivered",
    "items.productId": input.productId,
  }).lean();
  if (!order) {
    throw ApiError.forbidden("You can review this product after a delivered order.");
  }
  const product = await Product.findOne({ _id: input.productId, status: PUBLIC_PRODUCT_STATUS })
    .select("_id sellerId name")
    .lean();
  if (!product) throw ApiError.notFound("Product not found.");
  let review;
  try {
    review = await Review.create({
      productId: product._id,
      userId,
      orderId: input.orderId,
      rating: input.rating,
      content: input.content,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      throw ApiError.conflict("You have already reviewed this product.");
    }
    throw error;
  }
  await refreshProductRating(product._id);
  const author = await User.findById(userId).select("name avatar").lean();
  await notify({
    userId: product.sellerId,
    type: "comment",
    title: "New review on your listing",
    message: `${author?.name ?? "A customer"} rated ${product.name} ${input.rating}/5.`,
    link: "/seller/comments",
  });
  return {
    id: String(review._id),
    rating: review.rating,
    content: review.content,
    createdAt: review.createdAt.toISOString(),
    author: { id: userId, name: author?.name ?? "Customer", avatar: author?.avatar },
  };
}

export async function setReviewVisibility(
  reviewId: string,
  visible: boolean,
): Promise<void> {
  await connectDb();
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $set: { status: visible ? "visible" : "hidden" } },
    { returnDocument: "after" },
  );
  if (!review) throw ApiError.notFound("Review not found.");
  await refreshProductRating(review.productId);
}

export async function setCommentVisibility(
  commentId: string,
  visible: boolean,
): Promise<void> {
  await connectDb();
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { status: visible ? "visible" : "hidden" } },
    { returnDocument: "after" },
  );
  if (!comment) throw ApiError.notFound("Comment not found.");
}

export async function getRecentlyViewed(userId: string, limit = 8): Promise<ProductDTO[]> {
  await connectDb();
  const views = await ProductView.find({ userId })
    .sort({ lastViewedAt: -1 })
    .limit(limit)
    .lean();
  if (views.length === 0) return [];
  const products = await Product.find({
    _id: { $in: views.map((view) => view.productId) },
    status: PUBLIC_PRODUCT_STATUS,
  }).lean<LeanProduct[]>();
  const order = new Map(views.map((view, index) => [String(view.productId), index]));
  products.sort(
    (a, b) => (order.get(String(a._id)) ?? 99) - (order.get(String(b._id)) ?? 99),
  );
  return hydrateProducts(products);
}

export function canCustomerCancel(status: string): boolean {
  return ["pending", "confirmed"].includes(status);
}
