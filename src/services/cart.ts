import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { ProductEvent } from "@/models/ProductEvent";
import { PUBLIC_PRODUCT_STATUS } from "@/lib/constants";
import type { CartDTO, CartLineDTO } from "@/types";
import { calculateDeliveryFee, getPlatformSettings } from "@/services/settings";

type CartLike = {
  items: { productId: Types.ObjectId; quantity: number; addedAt: Date }[];
};

async function getOrCreateCart(userId: string) {
  await connectDb();
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { upsert: true, returnDocument: "after" },
  );
  return cart;
}

export async function buildCartDTO(cart: CartLike): Promise<CartDTO> {
  const settings = await getPlatformSettings();
  if (cart.items.length === 0) {
    return {
      items: [],
      subtotalCents: 0,
      deliveryFeeCents: 0,
      totalCents: 0,
      itemCount: 0,
      hasIssues: false,
    };
  }

  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .select(
      "name slug images priceCents currency stock status sellerId",
    )
    .lean();
  const sellerIds = [...new Set(products.map((product) => String(product.sellerId)))];
  const sellers = await User.find({ _id: { $in: sellerIds } })
    .select("name shopName")
    .lean();
  const sellerMap = new Map(sellers.map((seller) => [String(seller._id), seller]));
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const items: CartLineDTO[] = cart.items.map((item) => {
    const product = productMap.get(String(item.productId));
    if (!product) {
      return {
        productId: String(item.productId),
        name: "Unavailable product",
        sellerId: "",
        sellerName: "Unknown seller",
        unitPriceCents: 0,
        quantity: item.quantity,
        lineTotalCents: 0,
        stock: 0,
        available: false,
        issue: "This product is no longer available.",
      };
    }
    const seller = sellerMap.get(String(product.sellerId));
    let issue: string | undefined;
    if (product.status !== PUBLIC_PRODUCT_STATUS) issue = "This product is not currently available.";
    else if (product.stock <= 0) issue = "Out of stock.";
    else if (item.quantity > product.stock) issue = `Only ${product.stock} available.`;
    const available = !issue;
    return {
      productId: String(product._id),
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url,
      sellerId: String(product.sellerId),
      sellerName: seller?.shopName ?? seller?.name ?? "Seller",
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      lineTotalCents: available ? product.priceCents * item.quantity : 0,
      stock: product.stock,
      available,
      issue,
    };
  });

  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const deliveryFeeCents = calculateDeliveryFee(subtotalCents, settings);
  return {
    items,
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    hasIssues: items.some((item) => !item.available),
  };
}

export async function getCart(userId: string): Promise<CartDTO> {
  const cart = await getOrCreateCart(userId);
  return buildCartDTO(cart);
}

export async function getCartCount(userId: string): Promise<number> {
  await connectDb();
  const cart = await Cart.findOne({ userId }).select("items").lean();
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDTO> {
  if (!Types.ObjectId.isValid(productId)) throw ApiError.notFound("Product not found.");
  await connectDb();
  const product = await Product.findOne({ _id: productId, status: PUBLIC_PRODUCT_STATUS })
    .select("_id stock sellerId name")
    .lean();
  if (!product) throw ApiError.notFound("Product not found.");
  if (product.stock <= 0) throw ApiError.badRequest("This product is out of stock.");

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => String(item.productId) === productId);
  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, 99);
  if (nextQuantity > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} units are available.`);
  }

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({ productId: product._id, quantity, addedAt: new Date() });
  }
  await cart.save();

  void Product.updateOne({ _id: product._id }, { $inc: { cartAddCount: 1 } }).catch((error) =>
    console.error("[cart] failed to increment cartAddCount", error),
  );
  void ProductEvent.create({
    productId: product._id,
    sellerId: product.sellerId,
    type: "cart_add",
    userId,
  }).catch((error) => console.error("[cart] failed to record cart event", error));

  return buildCartDTO(cart);
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDTO> {
  if (!Types.ObjectId.isValid(productId)) throw ApiError.notFound("Product not found.");
  const cart = await getOrCreateCart(userId);
  const index = cart.items.findIndex((item) => String(item.productId) === productId);
  if (index === -1) throw ApiError.notFound("Item is not in your cart.");

  if (quantity <= 0) {
    cart.items.splice(index, 1);
    await cart.save();
    return buildCartDTO(cart);
  }

  const product = await Product.findById(productId).select("stock status").lean();
  if (!product) throw ApiError.notFound("Product not found.");
  if (product.stock < quantity) {
    throw ApiError.badRequest(`Only ${product.stock} units are available.`);
  }
  const item = cart.items[index];
  if (!item) throw ApiError.notFound("Item is not in your cart.");
  item.quantity = Math.min(quantity, 99);
  await cart.save();
  return buildCartDTO(cart);
}

export async function removeCartItem(userId: string, productId: string): Promise<CartDTO> {
  const cart = await getOrCreateCart(userId);
  await Cart.updateOne({ userId }, { $pull: { items: { productId } } });
  const fresh = await Cart.findOne({ userId });
  return buildCartDTO(fresh ?? cart);
}

export async function clearCart(userId: string): Promise<void> {
  await connectDb();
  await Cart.updateOne({ userId }, { $set: { items: [] } });
}
