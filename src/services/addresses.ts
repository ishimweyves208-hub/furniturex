import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import { Address } from "@/models/Address";
import type { AddressDTO } from "@/types";
import type { z } from "zod";
import type { addressInputSchema } from "@/lib/validation/product";

type AddressInput = z.infer<typeof addressInputSchema>;

function toDTO(address: {
  _id: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  isDefault: boolean;
}): AddressDTO {
  return {
    id: String(address._id),
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    country: address.country,
    isDefault: address.isDefault,
  };
}

export async function listAddresses(userId: string): Promise<AddressDTO[]> {
  await connectDb();
  const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return addresses.map(toDTO);
}

export async function createAddress(
  userId: string,
  input: AddressInput,
): Promise<AddressDTO> {
  await connectDb();
  const count = await Address.countDocuments({ userId });
  const shouldDefault = input.isDefault || count === 0;
  if (shouldDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }
  const address = await Address.create({
    userId,
    label: input.label,
    fullName: input.fullName,
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 || undefined,
    city: input.city,
    country: input.country,
    isDefault: shouldDefault,
  });
  return toDTO(address);
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput,
): Promise<AddressDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(addressId)) throw ApiError.notFound("Address not found.");
  if (input.isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }
  const address = await Address.findOneAndUpdate(
    { _id: addressId, userId },
    {
      $set: {
        label: input.label,
        fullName: input.fullName,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || undefined,
        city: input.city,
        country: input.country,
        isDefault: Boolean(input.isDefault),
      },
    },
    { returnDocument: "after" },
  );
  if (!address) throw ApiError.notFound("Address not found.");
  return toDTO(address);
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  await connectDb();
  if (!Types.ObjectId.isValid(addressId)) throw ApiError.notFound("Address not found.");
  const address = await Address.findOneAndDelete({ _id: addressId, userId });
  if (!address) throw ApiError.notFound("Address not found.");
  if (address.isDefault) {
    const next = await Address.findOne({ userId }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  await connectDb();
  if (!Types.ObjectId.isValid(addressId)) throw ApiError.notFound("Address not found.");
  const address = await Address.findOne({ _id: addressId, userId }).lean();
  if (!address) throw ApiError.notFound("Address not found.");
  await Address.updateMany({ userId }, { $set: { isDefault: false } });
  await Address.updateOne({ _id: addressId, userId }, { $set: { isDefault: true } });
}
