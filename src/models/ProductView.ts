import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IProductView {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  sellerId: Types.ObjectId;
  viewerKey: string;
  userId?: Types.ObjectId | null;
  viewCount: number;
  firstViewedAt: Date;
  lastViewedAt: Date;
}

const productViewSchema = new Schema<IProductView>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    viewerKey: { type: String, required: true, maxlength: 128 },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    viewCount: { type: Number, default: 1, min: 1 },
    firstViewedAt: { type: Date, default: () => new Date() },
    lastViewedAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false },
);

productViewSchema.index({ productId: 1, viewerKey: 1 }, { unique: true });
productViewSchema.index({ userId: 1, lastViewedAt: -1 });

export const ProductView: Model<IProductView> =
  models.ProductView ?? model<IProductView>("ProductView", productViewSchema);
