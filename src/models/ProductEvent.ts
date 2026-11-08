import { Schema, model, models, type Model, type Types } from "mongoose";

const EVENT_TYPES = ["view", "cart_add", "order", "sale"] as const;
export type ProductEventType = (typeof EVENT_TYPES)[number];

export interface IProductEvent {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  sellerId: Types.ObjectId;
  type: ProductEventType;
  userId?: Types.ObjectId | null;
  anonId?: string | null;
  valueCents?: number;
  createdAt: Date;
}

const productEventSchema = new Schema<IProductEvent>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    anonId: { type: String, maxlength: 128, default: null },
    valueCents: { type: Number, min: 0 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false },
);

productEventSchema.index({ sellerId: 1, type: 1, createdAt: -1 });
productEventSchema.index({ productId: 1, type: 1, createdAt: -1 });
productEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

export const ProductEvent: Model<IProductEvent> =
  models.ProductEvent ?? model<IProductEvent>("ProductEvent", productEventSchema);
