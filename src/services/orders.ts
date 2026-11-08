import { randomBytes } from "node:crypto";
import mongoose, { Types } from "mongoose";
import type { QueryFilter } from "mongoose";
import { connectDb, isTransactionSupported } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
  type UserRole,
} from "@/lib/constants";
import type { IOrder, IOrderItem } from "@/models/Order";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Cart } from "@/models/Cart";
import { ProductEvent } from "@/models/ProductEvent";
import type { OrderDTO, Paginated } from "@/types";
import type { z } from "zod";
import type { checkoutSchema } from "@/lib/validation/product";
import { calculateDeliveryFee, getPlatformSettings } from "@/services/settings";
import { notify } from "@/services/notifications";
import { recordAudit } from "@/services/audit";

type CheckoutInput = z.infer<typeof checkoutSchema>;

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}
type LeanOrder = IOrder & { _id: Types.ObjectId };
type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  shopName?: string;
  shopSlug?: string;
};

export interface OrderActor {
  id: string;
  email: string;
  role: UserRole;
}

function orderNumber(groupNumber: string, index: number): string {
  return `${groupNumber}-${index + 1}`;
}

function newGroupNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `FX-${date}-${random}`;
}

function toOrderDTO(
  order: LeanOrder,
  customer?: LeanUser | null,
  seller?: LeanUser | null,
): OrderDTO {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    groupNumber: order.groupNumber,
    customerId: String(order.customerId),
    sellerId: String(order.sellerId),
    items: order.items.map((item) => ({
      productId: String(item.productId),
      name: item.name,
      image: item.image,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    deliveryAddress: {
      fullName: order.deliveryAddress.fullName,
      phone: order.deliveryAddress.phone,
      addressLine1: order.deliveryAddress.addressLine1,
      addressLine2: order.deliveryAddress.addressLine2,
      city: order.deliveryAddress.city,
      country: order.deliveryAddress.country,
      notes: order.deliveryAddress.notes,
    },
    subtotalCents: order.subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: order.totalCents,
    currency: order.currency,
    paymentMethod: "cod",
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      at: entry.at.toISOString(),
      by: entry.by ? String(entry.by) : null,
      note: entry.note,
    })),
    stockRestored: order.stockRestored,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: customer
      ? { id: String(customer._id), name: customer.name, email: customer.email }
      : undefined,
    seller: seller
      ? {
          id: String(seller._id),
          name: seller.name,
          shopName: seller.shopName,
          shopSlug: seller.shopSlug,
        }
      : undefined,
  };
}

async function hydrateOrders(
  orders: LeanOrder[],
  include: { customer?: boolean; seller?: boolean } = {},
): Promise<OrderDTO[]> {
  if (orders.length === 0) return [];
  const userIds = new Set<string>();
  if (include.customer) orders.forEach((order) => userIds.add(String(order.customerId)));
  if (include.seller) orders.forEach((order) => userIds.add(String(order.sellerId)));
  const users =
    userIds.size > 0
      ? await User.find({ _id: { $in: [...userIds] } })
          .select("name email shopName shopSlug")
          .lean<LeanUser[]>()
      : [];
  const map = new Map(users.map((user) => [String(user._id), user]));
  return orders.map((order) =>
    toOrderDTO(
      order,
      include.customer ? map.get(String(order.customerId)) : undefined,
      include.seller ? map.get(String(order.sellerId)) : undefined,
    ),
  );
}

async function findByIdempotencyKey(
  customerId: string,
  key: string,
): Promise<LeanOrder[]> {
  return Order.find({ customerId, idempotencyKey: key }).lean<LeanOrder[]>();
}

class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export interface CheckoutResult {
  orders: OrderDTO[];
  groupNumber: string;
  totalCents: number;
}

export async function createCheckout(
  customerId: string,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  await connectDb();

  const existing = await findByIdempotencyKey(customerId, input.idempotencyKey);
  if (existing.length > 0) {
    return {
      orders: await hydrateOrders(existing, { seller: true }),
      groupNumber: existing[0]?.groupNumber ?? "",
      totalCents: existing.reduce((sum, order) => sum + order.totalCents, 0),
    };
  }

  const cart = await Cart.findOne({ userId: customerId }).lean();
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Your cart is empty.");
  }

  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const lines: {
    product: (typeof products)[number];
    quantity: number;
  }[] = [];
  for (const item of cart.items) {
    const product = productMap.get(String(item.productId));
    if (!product) throw ApiError.badRequest("An item in your cart is no longer available.");
    if (product.status !== "approved") {
      throw ApiError.badRequest(`${product.name} is not currently available for purchase.`);
    }
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(
        `Only ${product.stock} units of ${product.name} remain. Update your cart to continue.`,
      );
    }
    lines.push({ product, quantity: item.quantity });
  }

  const settings = await getPlatformSettings();
  const groupNumber = newGroupNumber();
  const groups = new Map<string, typeof lines>();
  for (const line of lines) {
    const sellerId = String(line.product.sellerId);
    const group = groups.get(sellerId) ?? [];
    group.push(line);
    groups.set(sellerId, group);
  }

  const orderDocs = [...groups.entries()].map(([sellerId, groupLines], index) => {
    const items: IOrderItem[] = groupLines.map((line) => ({
      productId: line.product._id,
      name: line.product.name,
      image: line.product.images[0]?.url,
      unitPriceCents: line.product.priceCents,
      quantity: line.quantity,
      lineTotalCents: line.product.priceCents * line.quantity,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const deliveryFee = calculateDeliveryFee(subtotal, settings);
    return {
      orderNumber: orderNumber(groupNumber, index),
      groupNumber,
      customerId: new Types.ObjectId(customerId),
      sellerId: new Types.ObjectId(sellerId),
      items,
      deliveryAddress: {
        fullName: input.fullName,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || undefined,
        city: input.city,
        country: input.country,
        notes: input.notes || undefined,
      },
      subtotalCents: subtotal,
      deliveryFeeCents: deliveryFee,
      totalCents: subtotal + deliveryFee,
      currency: "USD",
      paymentMethod: "cod" as const,
      paymentStatus: "unpaid" as const,
      orderStatus: "pending" as const,
      statusHistory: [
        {
          status: "pending" as const,
          at: new Date(),
          by: new Types.ObjectId(customerId),
          note: "Order placed with Cash on Delivery.",
        },
      ],
      idempotencyKey: input.idempotencyKey,
      stockRestored: false,
    };
  });

  const events = lines.map((line) => ({
    productId: line.product._id,
    sellerId: line.product.sellerId,
    type: "order" as const,
    userId: new Types.ObjectId(customerId),
    valueCents: line.product.priceCents * line.quantity,
  }));

  let created: LeanOrder[] = [];
  let createdInsideTransaction = false;

  if (await isTransactionSupported()) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const line of lines) {
          const result = await Product.updateOne(
            {
              _id: line.product._id,
              status: "approved",
              stock: { $gte: line.quantity },
            },
            { $inc: { stock: -line.quantity, orderCount: 1 } },
            { session },
          );
          if (result.modifiedCount !== 1) {
            throw new StockError(`${line.product.name} just went out of stock.`);
          }
        }
        const inserted = await Order.insertMany(orderDocs, { session, ordered: true });
        created = inserted as unknown as LeanOrder[];
        await Cart.updateOne({ userId: customerId }, { $set: { items: [] } }, { session });
        if (events.length > 0) {
          await ProductEvent.insertMany(events, { session });
        }
      });
      createdInsideTransaction = true;
    } catch (error) {
      if (isDuplicateKey(error)) {
        const duplicate = await findByIdempotencyKey(customerId, input.idempotencyKey);
        if (duplicate.length > 0) {
          return {
            orders: await hydrateOrders(duplicate, { seller: true }),
            groupNumber: duplicate[0]?.groupNumber ?? groupNumber,
            totalCents: duplicate.reduce((sum, order) => sum + order.totalCents, 0),
          };
        }
      }
      throw error instanceof StockError ? ApiError.conflict(error.message) : error;
    } finally {
      await session.endSession();
    }
  }

  if (!createdInsideTransaction) {
    const applied: { productId: Types.ObjectId; quantity: number }[] = [];
    try {
      for (const line of lines) {
        const result = await Product.updateOne(
          { _id: line.product._id, status: "approved", stock: { $gte: line.quantity } },
          { $inc: { stock: -line.quantity, orderCount: 1 } },
        );
        if (result.modifiedCount !== 1) {
          throw new StockError(`${line.product.name} just went out of stock.`);
        }
        applied.push({ productId: line.product._id, quantity: line.quantity });
      }
      const insertedIds: Types.ObjectId[] = [];
      try {
        for (const doc of orderDocs) {
          const inserted = await Order.create(doc);
          insertedIds.push(inserted._id);
          created.push(inserted.toObject() as LeanOrder);
        }
      } catch (error) {
        await Order.deleteMany({ _id: { $in: insertedIds } });
        throw error;
      }
      await Cart.updateOne({ userId: customerId }, { $set: { items: [] } });
      if (events.length > 0) {
        await ProductEvent.insertMany(events).catch((error: unknown) =>
          console.error("[orders] failed to record order events", error),
        );
      }
    } catch (error) {
      await Promise.all(
        applied.map((entry) =>
          Product.updateOne(
            { _id: entry.productId },
            { $inc: { stock: entry.quantity, orderCount: -1 } },
          ),
        ),
      );
      if (isDuplicateKey(error)) {
        const duplicate = await findByIdempotencyKey(customerId, input.idempotencyKey);
        if (duplicate.length > 0) {
          return {
            orders: await hydrateOrders(duplicate, { seller: true }),
            groupNumber: duplicate[0]?.groupNumber ?? groupNumber,
            totalCents: duplicate.reduce((sum, order) => sum + order.totalCents, 0),
          };
        }
      }
      throw error instanceof StockError ? ApiError.conflict(error.message) : error;
    }
  }

  const customer = await User.findById(customerId).select("name email").lean<LeanUser>();
  const sellerIds = [...groups.keys()];
  const sellers = await User.find({ _id: { $in: sellerIds } })
    .select("name email shopName shopSlug")
    .lean<LeanUser[]>();

  await Promise.all(
    created.map((order) => {
      const seller = sellers.find((entry) => String(entry._id) === String(order.sellerId));
      return Promise.all([
        notify({
          userId: order.sellerId,
          type: "order",
          title: "New order received",
          message: `${customer?.name ?? "A customer"} placed order ${order.orderNumber} (COD, $${(
            order.totalCents / 100
          ).toFixed(2)}).`,
          link: `/seller/orders/${order._id}`,
        }),
        notify({
          userId: customerId,
          type: "order",
          title: "Order placed",
          message: `Your order ${order.orderNumber} from ${seller?.shopName ?? "a seller"} is awaiting confirmation.`,
          link: `/account/orders/${order._id}`,
        }),
      ]);
    }),
  );

  if (input.saveAddress) {
    const { Address } = await import("@/models/Address");
    const count = await Address.countDocuments({ userId: customerId });
    await Address.create({
      userId: customerId,
      label: count === 0 ? "Primary address" : "Checkout address",
      fullName: input.fullName,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 || undefined,
      city: input.city,
      country: input.country,
      isDefault: count === 0,
    });
  }

  return {
    orders: await hydrateOrders(created, { seller: true }),
    groupNumber,
    totalCents: created.reduce((sum, order) => sum + order.totalCents, 0),
  };
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export async function listCustomerOrders(
  customerId: string,
  options: { page?: number; pageSize?: number; status?: string } = {},
): Promise<Paginated<OrderDTO>> {
  await connectDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 10, 1), 50);
  const filter: QueryFilter<IOrder> = { customerId };
  if (options.status && options.status !== "all" && isOrderStatus(options.status)) {
    filter.orderStatus = options.status;
  }
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanOrder[]>(),
    Order.countDocuments(filter),
  ]);
  return {
    items: await hydrateOrders(orders, { seller: true }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCustomerOrder(
  customerId: string,
  orderId: string,
): Promise<OrderDTO | null> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) return null;
  const order = await Order.findOne({ _id: orderId, customerId }).lean<LeanOrder>();
  if (!order) return null;
  const [dto] = await hydrateOrders([order], { seller: true });
  return dto ?? null;
}

export async function getCustomerOrderGroup(
  customerId: string,
  groupNumber: string,
): Promise<OrderDTO[]> {
  await connectDb();
  const orders = await Order.find({ customerId, groupNumber })
    .sort({ orderNumber: 1 })
    .lean<LeanOrder[]>();
  return hydrateOrders(orders, { seller: true });
}

export async function listSellerOrders(
  sellerId: string,
  options: { page?: number; pageSize?: number; status?: string; q?: string } = {},
): Promise<Paginated<OrderDTO>> {
  await connectDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 50);
  const filter: QueryFilter<IOrder> = { sellerId };
  if (options.status && options.status !== "all" && isOrderStatus(options.status)) {
    filter.orderStatus = options.status;
  }
  if (options.q) {
    filter.orderNumber = new RegExp(options.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanOrder[]>(),
    Order.countDocuments(filter),
  ]);
  return {
    items: await hydrateOrders(orders, { customer: true }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSellerOrder(
  sellerId: string,
  orderId: string,
): Promise<OrderDTO | null> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) return null;
  const order = await Order.findOne({ _id: orderId, sellerId }).lean<LeanOrder>();
  if (!order) return null;
  const [dto] = await hydrateOrders([order], { customer: true });
  return dto ?? null;
}

export async function listAdminOrders(
  options: { page?: number; pageSize?: number; status?: string; q?: string; payment?: string } = {},
): Promise<Paginated<OrderDTO>> {
  await connectDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 60);
  const filter: QueryFilter<IOrder> = {};
  if (options.status && options.status !== "all" && isOrderStatus(options.status)) {
    filter.orderStatus = options.status;
  }
  if (options.payment && options.payment !== "all" && isPaymentStatus(options.payment)) {
    filter.paymentStatus = options.payment;
  }
  if (options.q) {
    filter.$or = [
      { orderNumber: new RegExp(options.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { groupNumber: new RegExp(options.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanOrder[]>(),
    Order.countDocuments(filter),
  ]);
  return {
    items: await hydrateOrders(orders, { customer: true, seller: true }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAdminOrder(orderId: string): Promise<OrderDTO | null> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) return null;
  const order = await Order.findById(orderId).lean<LeanOrder>();
  if (!order) return null;
  const [dto] = await hydrateOrders([order], { customer: true, seller: true });
  return dto ?? null;
}

const SELLER_ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["processing", "rejected"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export async function updateOrderStatus(
  actor: OrderActor,
  orderId: string,
  targetStatus: OrderStatus,
  note?: string,
): Promise<OrderDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw ApiError.notFound("Order not found.");
  const order = await Order.findById(orderId).lean<LeanOrder>();
  if (!order) throw ApiError.notFound("Order not found.");

  const current = order.orderStatus;
  let allowed = false;

  if (actor.role === "customer") {
    if (String(order.customerId) !== actor.id) throw ApiError.notFound("Order not found.");
    allowed =
      targetStatus === "cancelled" && ["pending", "confirmed"].includes(current);
  } else if (actor.role === "seller") {
    if (String(order.sellerId) !== actor.id) throw ApiError.notFound("Order not found.");
    allowed = SELLER_ALLOWED[current].includes(targetStatus);
  } else {
    allowed =
      ORDER_TRANSITIONS[current].includes(targetStatus) ||
      (targetStatus === "cancelled" && ["pending", "confirmed", "processing"].includes(current));
  }

  if (!allowed) {
    throw ApiError.badRequest(`Cannot change an order from ${current} to ${targetStatus}.`);
  }

  const update: Record<string, unknown> = {
    $set: { orderStatus: targetStatus },
    $push: {
      statusHistory: {
        status: targetStatus,
        at: new Date(),
        by: actor.id,
        note: note || undefined,
      },
    },
  };

  if (targetStatus === "cancelled" || targetStatus === "rejected") {
    update.$set = {
      ...(update.$set as Record<string, unknown>),
      cancelledAt: new Date(),
      cancelledBy: actor.id,
    };
  }
  if (targetStatus === "delivered") {
    update.$set = {
      ...(update.$set as Record<string, unknown>),
      paymentStatus: "paid",
      deliveredAt: new Date(),
    };
  }

  const updated = await Order.findOneAndUpdate(
    { _id: orderId, orderStatus: current },
    update,
    { returnDocument: "after" },
  ).lean<LeanOrder>();
  if (!updated) {
    throw ApiError.conflict("This order was updated by someone else. Refresh and try again.");
  }

  if (targetStatus === "cancelled" || targetStatus === "rejected") {
    const claimed = await Order.findOneAndUpdate(
      { _id: orderId, stockRestored: false },
      { $set: { stockRestored: true } },
      { returnDocument: "before" },
    ).lean<LeanOrder>();
    if (claimed) {
      await Promise.all(
        order.items.map((item) =>
          Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }),
        ),
      );
    }
  }

  if (targetStatus === "delivered" && current !== "delivered") {
    await Promise.all(
      order.items.flatMap((item) => [
        Product.updateOne(
          { _id: item.productId },
          {
            $inc: {
              salesCount: item.quantity,
              revenueCents: item.lineTotalCents,
            },
          },
        ),
        ProductEvent.create({
          productId: item.productId,
          sellerId: order.sellerId,
          type: "sale",
          userId: order.customerId,
          valueCents: item.lineTotalCents,
        }),
      ]),
    );
  }

  const statusLabel = targetStatus.replace(/_/g, " ");
  const counterpartId =
    actor.role === "customer" ? order.sellerId : order.customerId;

  await Promise.all([
    notify({
      userId: counterpartId,
      type: "order",
      title: `Order ${statusLabel}`,
      message: `Order ${order.orderNumber} is now ${statusLabel}.`,
      link:
        actor.role === "customer"
          ? `/seller/orders/${orderId}`
          : `/account/orders/${orderId}`,
    }),
    notify({
      userId: actor.role === "customer" ? order.customerId : order.sellerId,
      type: "order",
      title: `Order ${statusLabel}`,
      message: `Order ${order.orderNumber} was marked ${statusLabel}.`,
      link:
        actor.role === "seller"
          ? `/seller/orders/${orderId}`
          : `/account/orders/${orderId}`,
    }),
  ]);

  if (actor.role === "superadmin") {
    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "order.status_changed",
      targetType: "order",
      targetId: orderId,
      metadata: { from: current, to: targetStatus, note: note ?? null },
    });
  }

  const [dto] = await hydrateOrders([updated], { customer: true, seller: true });
  if (!dto) throw ApiError.notFound("Order not found.");
  return dto;
}

export async function customerOrderStats(customerId: string) {
  await connectDb();
  const [total, active, delivered, spentRows] = await Promise.all([
    Order.countDocuments({ customerId }),
    Order.countDocuments({
      customerId,
      orderStatus: { $in: ["pending", "confirmed", "processing", "shipped"] },
    }),
    Order.countDocuments({ customerId, orderStatus: "delivered" }),
    Order.aggregate<{ total: number }>([
      { $match: { customerId: new Types.ObjectId(customerId), orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalCents" } } },
    ]),
  ]);
  return { total, active, delivered, spentCents: spentRows[0]?.total ?? 0 };
}
