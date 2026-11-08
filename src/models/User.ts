import { Schema, model, models, type HydratedDocument, type Model, type Types } from "mongoose";
import { ACCOUNT_STATUSES, SELLER_STATUSES, USER_ROLES } from "@/lib/constants";
import type { AccountStatus, SellerStatus, UserRole } from "@/lib/constants";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  avatar?: string;
  sellerStatus?: SellerStatus;
  shopName?: string;
  shopSlug?: string;
  shopDescription?: string;
  shopLogo?: string;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpiresAt?: Date | null;
  verificationTokenHash?: string | null;
  verificationExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 40 },
    role: { type: String, enum: USER_ROLES, default: "customer", index: true },
    accountStatus: { type: String, enum: ACCOUNT_STATUSES, default: "active", index: true },
    emailVerified: { type: Boolean, default: false },
    avatar: { type: String, trim: true },
    sellerStatus: { type: String, enum: SELLER_STATUSES },
    shopName: { type: String, trim: true, maxlength: 120 },
    shopSlug: { type: String, trim: true, lowercase: true, maxlength: 90 },
    shopDescription: { type: String, trim: true, maxlength: 2000 },
    shopLogo: { type: String, trim: true },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
    verificationTokenHash: { type: String, select: false },
    verificationExpiresAt: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.resetPasswordTokenHash;
        delete ret.verificationTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ shopSlug: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, accountStatus: 1, createdAt: -1 });
userSchema.index({ name: "text", shopName: "text" });

export type UserDocument = HydratedDocument<IUser>;

export const User: Model<IUser> = models.User ?? model<IUser>("User", userSchema);
