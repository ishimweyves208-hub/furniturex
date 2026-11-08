import { cache } from "react";
import { connectDb } from "@/lib/db/connect";
import { PlatformSetting, type IPlatformSetting } from "@/models/PlatformSetting";

export type PlatformSettings = Pick<
  IPlatformSetting,
  | "deliveryFeeCents"
  | "freeDeliveryThresholdCents"
  | "requireReapprovalOnMaterialChange"
  | "supportEmail"
  | "marketplaceTagline"
>;

const DEFAULTS: PlatformSettings = {
  deliveryFeeCents: 0,
  freeDeliveryThresholdCents: 150000,
  requireReapprovalOnMaterialChange: true,
  supportEmail: "support@furniturex.example",
  marketplaceTagline: "Considered furniture from independent makers.",
};

export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  await connectDb();
  const setting = await PlatformSetting.findOneAndUpdate(
    { key: "platform" },
    { $setOnInsert: { key: "platform", ...DEFAULTS } },
    { upsert: true, returnDocument: "after", lean: true },
  ).lean();
  if (!setting) return DEFAULTS;
  return {
    deliveryFeeCents: setting.deliveryFeeCents,
    freeDeliveryThresholdCents: setting.freeDeliveryThresholdCents,
    requireReapprovalOnMaterialChange: setting.requireReapprovalOnMaterialChange,
    supportEmail: setting.supportEmail,
    marketplaceTagline: setting.marketplaceTagline,
  };
});

export function calculateDeliveryFee(
  subtotalCents: number,
  settings: PlatformSettings,
): number {
  if (subtotalCents >= settings.freeDeliveryThresholdCents) return 0;
  return settings.deliveryFeeCents;
}

export async function updatePlatformSettings(
  input: PlatformSettings,
  updatedBy: string,
): Promise<PlatformSettings> {
  await connectDb();
  const updated = await PlatformSetting.findOneAndUpdate(
    { key: "platform" },
    { $set: { ...input, updatedBy } },
    { upsert: true, returnDocument: "after", lean: true },
  ).lean();
  if (!updated) throw new Error("Failed to update platform settings.");
  return {
    deliveryFeeCents: updated.deliveryFeeCents,
    freeDeliveryThresholdCents: updated.freeDeliveryThresholdCents,
    requireReapprovalOnMaterialChange: updated.requireReapprovalOnMaterialChange,
    supportEmail: updated.supportEmail,
    marketplaceTagline: updated.marketplaceTagline,
  };
}
