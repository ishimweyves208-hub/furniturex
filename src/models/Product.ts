import { Schema, model, models, type Model, type Types } from "mongoose";
import { PRODUCT_STATUSES } from "@/lib/constants";
import type { ProductStatus } from "@/lib/constants";

export interface IProductImage {
  url: string;
  key?: string;
  alt?: string;
  isPrimary: boolean;
}

export interface IDimensions {
  width?: number;
  depth?: number;
  height?: number;
  unit: "in" | "cm";
}

export interface IProduct {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  images: IProductImage[];
  materials: string[];
  dimensions?: IDimensions;
  color?: string;
  stock: number;
  status: ProductStatus;
  moderationReason?: string;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  approvedContentHash?: string | null;
  moderatedAt?: Date | null;
  submittedAt?: Date | null;
  publishedAt?: Date | null;
  isFeatured: boolean;
  isDemo?: boolean;
  viewCount: number;
  uniqueViewCount: number;
  likeCount: number;
  commentCount: number;
  cartAddCount: number;
  orderCount: number;
  salesCount: number;
  revenueCents: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    key: { type: String, trim: true },
    alt: { type: String, trim: true, maxlength: 200 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const dimensionsSchema = new Schema<IDimensions>(
  {
    width: { type: Number, min: 0 },
    depth: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ["in", "cm"], default: "in" },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 8000 },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    images: { type: [imageSchema], default: [] },
    materials: { type: [String], default: [] },
    dimensions: { type: dimensionsSchema },
    color: { type: String, trim: true, maxlength: 80 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: PRODUCT_STATUSES, default: "draft", index: true },
    moderationReason: { type: String, trim: true, maxlength: 1000 },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    approvedContentHash: { type: String, default: null },
    moderatedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    isFeatured: { type: Boolean, default: false, index: true },
    isDemo: { type: Boolean, default: false, index: true },
    viewCount: { type: Number, default: 0, min: 0 },
    uniqueViewCount: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    cartAddCount: { type: Number, default: 0, min: 0 },
    orderCount: { type: Number, default: 0, min: 0 },
    salesCount: { type: Number, default: 0, min: 0 },
    revenueCents: { type: Number, default: 0, min: 0 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

productSchema.index({ status: 1, categoryId: 1, createdAt: -1 });
productSchema.index({ status: 1, priceCents: 1 });
productSchema.index({ status: 1, viewCount: -1 });
productSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
productSchema.index({ status: 1, isFeatured: -1, publishedAt: -1 });
productSchema.index({ name: "text", description: "text", materials: "text" });

export const Product: Model<IProduct> = models.Product ?? model<IProduct>("Product", productSchema);
