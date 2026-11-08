import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IWishlistItem {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlistItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
wishlistSchema.index({ userId: 1, createdAt: -1 });

export const Wishlist: Model<IWishlistItem> =
  models.Wishlist ?? model<IWishlistItem>("Wishlist", wishlistSchema);
