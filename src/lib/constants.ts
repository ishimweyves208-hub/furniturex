export const CURRENCY = "USD";

export const SESSION_COOKIE = "fx_session";
export const SESSION_TTL_DAYS = 14;
export const SESSION_RENEW_AFTER_HOURS = 24;

export const VIEWER_COOKIE = "fx_vid";
export const VIEWER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const USER_ROLES = ["customer", "seller", "superadmin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PRODUCT_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "archived",
  "suspended",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ACCOUNT_STATUSES = ["active", "suspended", "disabled"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const SELLER_STATUSES = ["active", "pending", "suspended"] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const COMMENT_STATUSES = ["visible", "hidden"] as const;

export const NOTIFICATION_TYPES = [
  "account",
  "product",
  "order",
  "comment",
  "admin",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const PAGE_SIZE = 12;
export const DASHBOARD_PAGE_SIZE = 20;

export const PRODUCT_SORTS = ["newest", "price-asc", "price-desc", "popular"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const REPORT_TYPES = [
  "sales",
  "products",
  "sellers",
  "customers",
  "orders",
  "categories",
  "engagement",
  "trends",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const CUSTOMER_CANCELLABLE_STATUSES = ["pending", "confirmed"] as const;

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["processing", "cancelled", "rejected"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export const PUBLIC_PRODUCT_STATUS = "approved";
