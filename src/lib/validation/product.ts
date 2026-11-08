import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid identifier.");

export const imageInputSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Image URL must be valid.")
    .max(1000)
    .refine((value) => value.startsWith("https://"), "Image URL must use HTTPS."),
  key: z.string().trim().max(500).optional(),
  alt: z.string().trim().max(200).optional(),
  isPrimary: z.boolean().optional(),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(3, "Product name is required.").max(160),
  categoryId: objectId,
  description: z.string().trim().min(20, "Add a description of at least 20 characters.").max(8000),
  price: z.coerce.number().min(0.01, "Price must be greater than zero.").max(1_000_000),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative.").max(100000),
  images: z.array(imageInputSchema).min(1, "Add at least one product image.").max(8),
  materials: z.union([z.array(z.string().trim().max(80)), z.string()]).optional(),
  dimensions: z
    .object({
      width: z.coerce.number().min(0).max(10000).optional(),
      depth: z.coerce.number().min(0).max(10000).optional(),
      height: z.coerce.number().min(0).max(10000).optional(),
      unit: z.enum(["in", "cm"]).default("in"),
    })
    .optional(),
  color: z.string().trim().max(80).optional().or(z.literal("")),
  action: z.enum(["draft", "submit"]).default("submit"),
});

export const productUpdateSchema = productInputSchema;

export const commentInputSchema = z.object({
  productId: objectId,
  content: z.string().trim().min(2, "Comment is too short.").max(2000),
});

export const reviewInputSchema = z.object({
  productId: objectId,
  orderId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(2, "Review is too short.").max(2000),
});

export const cartItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").max(99),
});

export const cartUpdateSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(0).max(99),
});

export const wishlistSchema = z.object({ productId: objectId });

export const likeSchema = z.object({ productId: objectId });

export const addressInputSchema = z.object({
  label: z.string().trim().min(1, "Address label is required.").max(60),
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  phone: z.string().trim().min(5, "Phone number is required.").max(40),
  addressLine1: z.string().trim().min(3, "Address is required.").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required.").max(120),
  country: z.string().trim().min(2, "Country is required.").max(120),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  phone: z.string().trim().min(5, "Phone number is required.").max(40),
  addressLine1: z.string().trim().min(3, "Delivery address is required.").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required.").max(120),
  country: z.string().trim().min(2, "Country is required.").max(120),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  saveAddress: z.boolean().optional(),
  idempotencyKey: z.string().uuid("A valid idempotency key is required."),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Category name is required.").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  image: z.string().trim().url("Image must be a valid URL.").max(1000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(10000).optional(),
  active: z.boolean().optional(),
});

export const uploadSignSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  size: z.coerce.number().int().min(1).max(8 * 1024 * 1024),
});

export const uploadConfirmSchema = z.object({
  key: z.string().trim().min(1).max(500),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "rejected",
  ]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const adminUserUpdateSchema = z.object({
  accountStatus: z.enum(["active", "suspended", "disabled"]).optional(),
  role: z.enum(["customer", "seller", "superadmin"]).optional(),
  sellerStatus: z.enum(["active", "pending", "suspended"]).optional(),
  name: z.string().trim().min(2).max(120).optional(),
});

export const moderationSchema = z.object({
  action: z.enum(["approve", "reject", "request_changes", "remove", "suspend", "restore"]),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const platformSettingSchema = z.object({
  deliveryFeeCents: z.coerce.number().int().min(0).max(1_000_000),
  freeDeliveryThresholdCents: z.coerce.number().int().min(0).max(100_000_000),
  requireReapprovalOnMaterialChange: z.boolean(),
  supportEmail: z.string().trim().email("Enter a valid support email.").max(254),
  marketplaceTagline: z.string().trim().min(3, "Tagline is required.").max(200),
});

export const notificationReadSchema = z.object({
  ids: z.array(objectId).max(100).optional(),
  all: z.boolean().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(2000),
});
