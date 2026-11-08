import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { connectDb } = await import("@/lib/db/connect");
  await connectDb();
});

afterAll(async () => {
  await mongoose.disconnect().catch(() => undefined);
  await mongo?.stop().catch(() => undefined);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

const address = {
  fullName: "Demo Customer",
  phone: "+1 555 0100",
  addressLine1: "12 Market Street",
  city: "Hudson",
  country: "United States",
};

async function seed() {
  const { User } = await import("@/models/User");
  const { Category } = await import("@/models/Category");
  const { Product } = await import("@/models/Product");
  const { Cart } = await import("@/models/Cart");
  const { PlatformSetting } = await import("@/models/PlatformSetting");

  const seller = await User.create({
    name: "Mara Ellison",
    email: "mara@example.com",
    passwordHash: "not-used",
    role: "seller",
    accountStatus: "active",
    emailVerified: true,
    sellerStatus: "active",
    shopName: "Ellison & Oak",
    shopSlug: "ellison-and-oak",
  });
  const customer = await User.create({
    name: "Demo Customer",
    email: "demo@example.com",
    passwordHash: "not-used",
    role: "customer",
    accountStatus: "active",
    emailVerified: true,
  });
  const category = await Category.create({ name: "Sofas", slug: "sofas", active: true });
  const product = await Product.create({
    sellerId: seller._id,
    categoryId: category._id,
    name: "Halden Sofa",
    slug: "halden-sofa",
    description: "A generous sofa with a solid oak frame and bouclé upholstery.",
    priceCents: 10000,
    images: [{ url: "https://images.unsplash.com/photo-1", alt: "Sofa", isPrimary: true }],
    materials: ["Oak"],
    stock: 5,
    status: "approved",
    publishedAt: new Date(),
  });
  await Cart.create({
    userId: customer._id,
    items: [{ productId: product._id, quantity: 2 }],
  });
  await PlatformSetting.create({
    key: "platform",
    deliveryFeeCents: 2500,
    freeDeliveryThresholdCents: 100000,
    requireReapprovalOnMaterialChange: true,
    supportEmail: "support@example.com",
    marketplaceTagline: "Considered furniture from independent makers.",
  });
  return { seller, customer, product };
}

describe("checkout integration", () => {
  it("creates a COD order, decrements stock and is idempotent", async () => {
    const { customer, product } = await seed();
    const { createCheckout, getCustomerOrder } = await import("@/services/orders");
    const { Product } = await import("@/models/Product");

    const input = { ...address, idempotencyKey: "3f3b9d2a-5a4a-4f6f-8a88-2a7d0c9b1e11" };
    const result = await createCheckout(String(customer._id), input);

    expect(result.orders).toHaveLength(1);
    const order = result.orders[0];
    expect(order?.subtotalCents).toBe(20000);
    expect(order?.deliveryFeeCents).toBe(2500);
    expect(order?.totalCents).toBe(22500);
    expect(order?.paymentStatus).toBe("unpaid");
    expect(order?.orderStatus).toBe("pending");

    const updated = await Product.findById(product._id).lean();
    expect(updated?.stock).toBe(3);

    const retry = await createCheckout(String(customer._id), input);
    expect(retry.orders).toHaveLength(1);
    expect(retry.orders[0]?.id).toBe(order?.id);
    expect(retry.groupNumber).toBe(result.groupNumber);

    const fetched = await getCustomerOrder(String(customer._id), order!.id);
    expect(fetched?.orderNumber).toBe(order?.orderNumber);
  });

  it("splits a multi-seller cart into grouped orders and restores stock on cancellation", async () => {
    const { customer, seller } = await seed();
    const { User } = await import("@/models/User");
    const { Category } = await import("@/models/Category");
    const { Product } = await import("@/models/Product");
    const { Cart } = await import("@/models/Cart");
    const { createCheckout, updateOrderStatus } = await import("@/services/orders");

    const secondSeller = await User.create({
      name: "Theo Nakamura",
      email: "theo@example.com",
      passwordHash: "not-used",
      role: "seller",
      accountStatus: "active",
      emailVerified: true,
      sellerStatus: "active",
      shopName: "Nakamura Workshop",
      shopSlug: "nakamura-workshop",
    });
    const category = await Category.findOne({ slug: "sofas" }).lean();
    const secondProduct = await Product.create({
      sellerId: secondSeller._id,
      categoryId: category!._id,
      name: "Juniper Chair",
      slug: "juniper-chair",
      description: "A slender chair with a woven paper-cord seat and ash frame.",
      priceCents: 5000,
      images: [{ url: "https://images.unsplash.com/photo-2", alt: "Chair", isPrimary: true }],
      stock: 2,
      status: "approved",
      publishedAt: new Date(),
    });
    await Cart.updateOne(
      { userId: customer._id },
      { $push: { items: { productId: secondProduct._id, quantity: 1 } } },
    );

    const result = await createCheckout(String(customer._id), {
      ...address,
      idempotencyKey: "8a7d0c9b-1e11-4f6f-8a88-65a4a4f6f8a8",
    });
    expect(result.orders).toHaveLength(2);
    expect(new Set(result.orders.map((order) => order.groupNumber)).size).toBe(1);

    const first = result.orders.find((order) => order.sellerId === String(seller._id));
    expect(first).toBeTruthy();
    await updateOrderStatus(
      { id: String(customer._id), email: customer.email, role: "customer" },
      first!.id,
      "cancelled",
    );
    const restored = await Product.findById(first!.items[0]!.productId).lean();
    expect(restored?.stock).toBe(5);
  });
});
