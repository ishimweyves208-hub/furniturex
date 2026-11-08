import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ILike {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

likeSchema.index({ userId: 1, productId: 1 }, { unique: true });
likeSchema.index({ productId: 1, createdAt: -1 });

export const Like: Model<ILike> = models.Like ?? model<ILike>("Like", likeSchema);
