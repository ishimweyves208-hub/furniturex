import type {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from "@/lib/constants";

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  active: boolean;
  productCount?: number;
}

export interface SellerPublicDTO {
  id: string;
  name: string;
  shopName: string;
  shopSlug: string;
  shopDescription?: string;
  shopLogo?: string;
  memberSince: string;
  productCount?: number;
  totalViews?: number;
}

export interface ProductImageDTO {
  url: string;
  key?: string;
  alt?: string;
  isPrimary: boolean;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  images: ProductImageDTO[];
  primaryImage?: string;
  materials: string[];
  dimensions?: { width?: number; depth?: number; height?: number; unit: "in" | "cm" };
  color?: string;
  stock: number;
  status: ProductStatus;
  moderationReason?: string;
  isFeatured: boolean;
  isDemo: boolean;
  viewCount: number;
  uniqueViewCount: number;
  likeCount: number;
  commentCount: number;
  cartAddCount: number;
  orderCount: number;
  salesCount: number;
  revenueCents: number;
  ratingAvg: number;
  ratingCount: number;
  category?: { id: string; name: string; slug: string };
  seller?: SellerPublicDTO;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CartLineDTO {
  productId: string;
  name: string;
  slug?: string;
  image?: string;
  sellerId: string;
  sellerName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stock: number;
  available: boolean;
  issue?: string;
}

export interface CartDTO {
  items: CartLineDTO[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  itemCount: number;
  hasIssues: boolean;
}

export interface OrderItemDTO {
  productId: string;
  name: string;
  image?: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface StatusHistoryDTO {
  status: OrderStatus;
  at: string;
  by?: string | null;
  note?: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  groupNumber: string;
  customerId: string;
  sellerId: string;
  items: OrderItemDTO[];
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    country: string;
    notes?: string;
  };
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: "cod";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: StatusHistoryDTO[];
  stockRestored: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; email: string };
  seller?: { id: string; name: string; shopName?: string; shopSlug?: string };
}

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface AddressDTO {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export interface CommentDTO {
  id: string;
  content: string;
  status: "visible" | "hidden";
  createdAt: string;
  author: { id: string; name: string; avatar?: string };
}

export interface ReviewDTO {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatar?: string };
}

export interface UserSummaryDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  accountStatus: "active" | "suspended" | "disabled";
  sellerStatus?: "active" | "pending" | "suspended";
  emailVerified: boolean;
  shopName?: string;
  shopSlug?: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface DashboardMetric {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "warning";
}

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  views: number;
  sales: number;
  revenue: number;
}
