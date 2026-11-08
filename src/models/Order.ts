import { Schema, model, models, type Model, type Types } from "mongoose";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/lib/constants";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  image?: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface IDeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  notes?: string;
}

export interface IStatusHistory {
  status: OrderStatus;
  at: Date;
  by?: Types.ObjectId | null;
  note?: string;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  groupNumber: string;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddress;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: "cod";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: IStatusHistory[];
  idempotencyKey: string;
  stockRestored: boolean;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  cancelledBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String },
    unitPriceCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    lineTotalCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const deliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
    addressLine2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    country: { type: String, required: true, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: () => new Date() },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, maxlength: 500 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    groupNumber: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    subtotalCents: { type: Number, required: true, min: 0 },
    deliveryFeeCents: { type: Number, required: true, min: 0, default: 0 },
    totalCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    paymentMethod: { type: String, enum: ["cod"], default: "cod" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid", index: true },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
    idempotencyKey: { type: String, required: true },
    stockRestored: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

orderSchema.index({ customerId: 1, idempotencyKey: 1, sellerId: 1 }, { unique: true });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = models.Order ?? model<IOrder>("Order", orderSchema);
