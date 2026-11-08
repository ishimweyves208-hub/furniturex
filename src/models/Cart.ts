import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart: Model<ICart> = models.Cart ?? model<ICart>("Cart", cartSchema);
