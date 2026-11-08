import { Schema, model, models, type Model, type Types } from "mongoose";
import { COMMENT_STATUSES } from "@/lib/constants";

export interface IReview {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  content: string;
  status: "visible" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true, minlength: 2, maxlength: 2000 },
    status: { type: String, enum: COMMENT_STATUSES, default: "visible", index: true },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

export const Review: Model<IReview> = models.Review ?? model<IReview>("Review", reviewSchema);
