import { Schema, model, models, type Model, type Types } from "mongoose";
import { COMMENT_STATUSES } from "@/lib/constants";

export interface IComment {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  status: "visible" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, minlength: 2, maxlength: 2000 },
    status: { type: String, enum: COMMENT_STATUSES, default: "visible", index: true },
  },
  { timestamps: true },
);

commentSchema.index({ productId: 1, status: 1, createdAt: -1 });

export const Comment: Model<IComment> = models.Comment ?? model<IComment>("Comment", commentSchema);
