import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IPlatformSetting {
  _id: Types.ObjectId;
  key: string;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  requireReapprovalOnMaterialChange: boolean;
  supportEmail: string;
  marketplaceTagline: string;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingSchema = new Schema<IPlatformSetting>(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    deliveryFeeCents: { type: Number, default: 0, min: 0 },
    freeDeliveryThresholdCents: { type: Number, default: 150000, min: 0 },
    requireReapprovalOnMaterialChange: { type: Boolean, default: true },
    supportEmail: { type: String, default: "support@furniturex.example", maxlength: 254 },
    marketplaceTagline: {
      type: String,
      default: "Considered furniture from independent makers.",
      maxlength: 200,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const PlatformSetting: Model<IPlatformSetting> =
  models.PlatformSetting ?? model<IPlatformSetting>("PlatformSetting", platformSettingSchema);
