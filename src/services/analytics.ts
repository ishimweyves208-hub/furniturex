import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import { Comment } from "@/models/Comment";
import { Review } from "@/models/Review";
import { ProductEvent } from "@/models/ProductEvent";
import { AuditLog } from "@/models/AuditLog";
import type { DashboardMetric, ProductPerformance, TrendPoint } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDailyRange(days: number): { start: Date; end: Date; keys: string[] } {
  const end = startOfDay(new Date());
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  const keys: string[] = [];
  for (let i = 0; i < days; i += 1) {
    keys.push(dateKey(new Date(start.getTime() + i * DAY_MS)));
  }
  return { start, end: new Date(end.getTime() + DAY_MS), keys };
}

function mergeTrend(
  keys: string[],
  orders: { _id: string; orders: number }[],
  revenue: { _id: string; revenue: number }[],
): TrendPoint[] {
  const orderMap = new Map(orders.map((row) => [row._id, row.orders]));
  const revenueMap = new Map(revenue.map((row) => [row._id, row.revenue]));
  return keys.map((date) => ({
    date,
    orders: orderMap.get(date) ?? 0,
    revenue: (revenueMap.get(date) ?? 0) / 100,
  }));
}

async function dailyTrend(
  orderMatch: Record<string, unknown>,
  days = 30,
): Promise<TrendPoint[]> {
  const { start, end, keys } = buildDailyRange(days);
  const [orders, revenue] = await Promise.all([
    Order.aggregate<{ _id: string; orders: number }>([
      { $match: { ...orderMatch, createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate<{ _id: string; revenue: number }>([
      {
        $match: {
          ...orderMatch,
          orderStatus: "delivered",
          deliveredAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt", timezone: "UTC" } },
          revenue: { $sum: "$totalCents" },
        },
      },
    ]),
  ]);
  return mergeTrend(keys, orders, revenue);
}

export interface SellerOverview {
  metrics: DashboardMetric[];
  statusCounts: Record<string, number>;
  salesTrend: TrendPoint[];
  topProducts: ProductPerformance[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    totalCents: number;
    createdAt: string;
  }[];
  recentComments: { id: string; author: string; productName: string; content: string; createdAt: string }[];
  pendingTasks: { pendingProducts: number; pendingOrders: number; rejectedProducts: number };
}

export async function getSellerOverview(sellerId: string): Promise<SellerOverview> {
  await connectDb();
  const sellerObjectId = new Types.ObjectId(sellerId);

  const [statusRows, totalsRows, orderTotals, deliveredTotals, trend, topProductRows, recentOrders] =
    await Promise.all([
      Product.aggregate<{ _id: string; count: number }>([
        { $match: { sellerId: sellerObjectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Product.aggregate<{
        views: number;
        uniqueViews: number;
        likes: number;
        comments: number;
        cartAdds: number;
      }>([
        { $match: { sellerId: sellerObjectId } },
        {
          $group: {
            _id: null,
            views: { $sum: "$viewCount" },
            uniqueViews: { $sum: "$uniqueViewCount" },
            likes: { $sum: "$likeCount" },
            comments: { $sum: "$commentCount" },
            cartAdds: { $sum: "$cartAddCount" },
          },
        },
      ]),
      Order.aggregate<{ count: number }>([
        { $match: { sellerId: sellerObjectId } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      Order.aggregate<{ count: number; revenue: number }>([
        { $match: { sellerId: sellerObjectId, orderStatus: "delivered" } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalCents" } } },
      ]),
      dailyTrend({ sellerId: sellerObjectId }, 30),
      Product.find({ sellerId: sellerObjectId })
        .sort({ viewCount: -1 })
        .limit(6)
        .select("name viewCount salesCount revenueCents")
        .lean(),
      Order.find({ sellerId: sellerObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

  const statusCounts = Object.fromEntries(statusRows.map((row) => [row._id, row.count]));
  const totals = totalsRows[0] ?? {
    views: 0,
    uniqueViews: 0,
    likes: 0,
    comments: 0,
    cartAdds: 0,
  };
  const orderTotal = orderTotals[0]?.count ?? 0;
  const completed = deliveredTotals[0] ?? { count: 0, revenue: 0 };

  const customerIds = [...new Set(recentOrders.map((order) => String(order.customerId)))];
  const customers = await User.find({ _id: { $in: customerIds } })
    .select("name")
    .lean();
  const customerMap = new Map(customers.map((customer) => [String(customer._id), customer.name]));

  const productIds = await Product.find({ sellerId: sellerObjectId }).select("_id name").lean();
  const productNameMap = new Map(productIds.map((product) => [String(product._id), product.name]));
  const recentComments = await Comment.find({
    productId: { $in: productIds.map((product) => product._id) },
    status: "visible",
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  const commentUserIds = [...new Set(recentComments.map((comment) => String(comment.userId)))];
  const commentUsers = await User.find({ _id: { $in: commentUserIds } })
    .select("name")
    .lean();
  const commentUserMap = new Map(
    commentUsers.map((user) => [String(user._id), user.name]),
  );

  return {
    metrics: [
      { label: "Total products", value: String(Object.values(statusCounts).reduce((a, b) => a + b, 0)) },
      { label: "Published", value: String(statusCounts.approved ?? 0), tone: "positive" },
      { label: "Pending approval", value: String(statusCounts.pending ?? 0), tone: "warning" },
      { label: "Rejected", value: String(statusCounts.rejected ?? 0) },
      { label: "Total views", value: totals.views.toLocaleString("en-US") },
      { label: "Unique views", value: totals.uniqueViews.toLocaleString("en-US") },
      { label: "Likes", value: totals.likes.toLocaleString("en-US") },
      { label: "Comments", value: totals.comments.toLocaleString("en-US") },
      { label: "Cart additions", value: totals.cartAdds.toLocaleString("en-US") },
      { label: "Total orders", value: orderTotal.toLocaleString("en-US") },
      { label: "Completed sales", value: completed.count.toLocaleString("en-US"), tone: "positive" },
      {
        label: "Revenue (delivered)",
        value: `$${(completed.revenue / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        tone: "positive",
      },
    ],
    statusCounts,
    salesTrend: trend,
    topProducts: topProductRows.map((product) => ({
      productId: String(product._id),
      name: product.name,
      views: product.viewCount,
      sales: product.salesCount,
      revenue: product.revenueCents / 100,
    })),
    recentOrders: recentOrders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      customerName: customerMap.get(String(order.customerId)) ?? "Customer",
      status: order.orderStatus,
      totalCents: order.totalCents,
      createdAt: order.createdAt.toISOString(),
    })),
    recentComments: recentComments.map((comment) => ({
      id: String(comment._id),
      author: commentUserMap.get(String(comment.userId)) ?? "Customer",
      productName: productNameMap.get(String(comment.productId)) ?? "Listing",
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    })),
    pendingTasks: {
      pendingProducts: statusCounts.pending ?? 0,
      pendingOrders: await Order.countDocuments({ sellerId, orderStatus: "pending" }),
      rejectedProducts: statusCounts.rejected ?? 0,
    },
  };
}

export interface SellerAnalytics {
  totals: { views: number; uniqueViews: number; cartAdds: number; orders: number; sales: number; revenue: number };
  trend: { date: string; views: number; cartAdds: number; orders: number; revenue: number }[];
  products: ProductPerformance[];
}

export async function getSellerAnalytics(
  sellerId: string,
  days = 30,
): Promise<SellerAnalytics> {
  await connectDb();
  const sellerObjectId = new Types.ObjectId(sellerId);
  const { start, end, keys } = buildDailyRange(days);

  const [eventRows, orderRows, revenueRows, productTotals, topProducts] = await Promise.all([
    ProductEvent.aggregate<{ _id: { date: string; type: string }; count: number }>([
      {
        $match: {
          sellerId: sellerObjectId,
          type: { $in: ["view", "cart_add"] },
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate<{ _id: string; count: number }>([
      { $match: { sellerId: sellerObjectId, createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate<{ _id: string; revenue: number }>([
      {
        $match: {
          sellerId: sellerObjectId,
          orderStatus: "delivered",
          deliveredAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt", timezone: "UTC" } },
          revenue: { $sum: "$totalCents" },
        },
      },
    ]),
    Product.aggregate<{
      views: number;
      uniqueViews: number;
      cartAdds: number;
    }>([
      { $match: { sellerId: sellerObjectId } },
      {
        $group: {
          _id: null,
          views: { $sum: "$viewCount" },
          uniqueViews: { $sum: "$uniqueViewCount" },
          cartAdds: { $sum: "$cartAddCount" },
        },
      },
    ]),
    Product.find({ sellerId: sellerObjectId })
      .sort({ viewCount: -1 })
      .limit(10)
      .select("name viewCount salesCount revenueCents")
      .lean(),
  ]);

  const viewsMap = new Map<string, number>();
  const cartMap = new Map<string, number>();
  for (const row of eventRows) {
    if (row._id.type === "view") viewsMap.set(row._id.date, row.count);
    if (row._id.type === "cart_add") cartMap.set(row._id.date, row.count);
  }
  const ordersMap = new Map(orderRows.map((row) => [row._id, row.count]));
  const revenueMap = new Map(revenueRows.map((row) => [row._id, row.revenue]));

  const totalOrders = await Order.countDocuments({ sellerId });
  const salesTotals = await Order.aggregate<{ count: number; revenue: number; sales: number }>([
    { $match: { sellerId: sellerObjectId, orderStatus: "delivered" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: "$totalCents" },
        sales: { $sum: { $sum: "$items.quantity" } },
      },
    },
  ]);
  const totalsRow = productTotals[0] ?? { views: 0, uniqueViews: 0, cartAdds: 0 };
  const sales = salesTotals[0] ?? { count: 0, revenue: 0, sales: 0 };

  return {
    totals: {
      views: totalsRow.views,
      uniqueViews: totalsRow.uniqueViews,
      cartAdds: totalsRow.cartAdds,
      orders: totalOrders,
      sales: sales.sales,
      revenue: sales.revenue / 100,
    },
    trend: keys.map((date) => ({
      date,
      views: viewsMap.get(date) ?? 0,
      cartAdds: cartMap.get(date) ?? 0,
      orders: ordersMap.get(date) ?? 0,
      revenue: (revenueMap.get(date) ?? 0) / 100,
    })),
    products: topProducts.map((product) => ({
      productId: String(product._id),
      name: product.name,
      views: product.viewCount,
      sales: product.salesCount,
      revenue: product.revenueCents / 100,
    })),
  };
}

export interface AdminOverview {
  metrics: DashboardMetric[];
  userCounts: { customers: number; sellers: number; superadmins: number; total: number };
  productCounts: Record<string, number>;
  orderCounts: Record<string, number>;
  trend: TrendPoint[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    createdAt: string;
    customerName: string;
  }[];
  recentAudit: { id: string; action: string; actorEmail?: string; targetType: string; createdAt: string }[];
  topCategories: { name: string; products: number }[];
  pendingApprovals: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await connectDb();
  const [
    userCounts,
    productStatusRows,
    orderStatusRows,
    revenueRows,
    trend,
    recentOrders,
    recentAudit,
    categoryRows,
    pendingApprovals,
  ] = await Promise.all([
    User.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Product.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ revenue: number; count: number }>([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, revenue: { $sum: "$totalCents" }, count: { $sum: 1 } } },
    ]),
    dailyTrend({}, 30),
    Order.find().sort({ createdAt: -1 }).limit(6).lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    Category.aggregate<{ name: string; products: number }>([
      {
        $lookup: {
          from: "products",
          let: { categoryId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$categoryId", "$$categoryId"] }, status: "approved" } },
            { $count: "count" },
          ],
          as: "productCount",
        },
      },
      {
        $project: {
          name: 1,
          products: { $ifNull: [{ $arrayElemAt: ["$productCount.count", 0] }, 0] },
        },
      },
      { $sort: { products: -1 } },
      { $limit: 6 },
    ]),
    Product.countDocuments({ status: "pending" }),
  ]);

  const users = Object.fromEntries(userCounts.map((row) => [row._id, row.count]));
  const products = Object.fromEntries(productStatusRows.map((row) => [row._id, row.count]));
  const orders = Object.fromEntries(orderStatusRows.map((row) => [row._id, row.count]));
  const revenue = revenueRows[0] ?? { revenue: 0, count: 0 };
  const customerIds = [...new Set(recentOrders.map((order) => String(order.customerId)))];
  const customers = await User.find({ _id: { $in: customerIds } })
    .select("name")
    .lean();
  const customerMap = new Map(customers.map((customer) => [String(customer._id), customer.name]));

  return {
    metrics: [
      { label: "Total users", value: String((users.customer ?? 0) + (users.seller ?? 0) + (users.superadmin ?? 0)) },
      { label: "Sellers", value: String(users.seller ?? 0) },
      { label: "Customers", value: String(users.customer ?? 0) },
      { label: "Total products", value: String(Object.values(products).reduce((a, b) => a + b, 0)) },
      { label: "Pending products", value: String(products.pending ?? 0), tone: "warning" },
      { label: "Approved products", value: String(products.approved ?? 0), tone: "positive" },
      { label: "Total orders", value: String(Object.values(orders).reduce((a, b) => a + b, 0)) },
      { label: "Delivered orders", value: String(orders.delivered ?? 0), tone: "positive" },
      { label: "Cancelled orders", value: String(orders.cancelled ?? 0) },
      { label: "Completed sales", value: revenue.count.toLocaleString("en-US"), tone: "positive" },
      {
        label: "Revenue (delivered)",
        value: `$${(revenue.revenue / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        tone: "positive",
      },
    ],
    userCounts: {
      customers: users.customer ?? 0,
      sellers: users.seller ?? 0,
      superadmins: users.superadmin ?? 0,
      total: (users.customer ?? 0) + (users.seller ?? 0) + (users.superadmin ?? 0),
    },
    productCounts: products,
    orderCounts: orders,
    trend,
    recentOrders: recentOrders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      totalCents: order.totalCents,
      createdAt: order.createdAt.toISOString(),
      customerName: customerMap.get(String(order.customerId)) ?? "Customer",
    })),
    recentAudit: recentAudit.map((log) => ({
      id: String(log._id),
      action: log.action,
      actorEmail: log.actorEmail,
      targetType: log.targetType,
      createdAt: log.createdAt.toISOString(),
    })),
    topCategories: categoryRows,
    pendingApprovals,
  };
}

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportResult {
  type: string;
  title: string;
  from?: string;
  to?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}

export type ReportType =
  | "sales"
  | "products"
  | "sellers"
  | "customers"
  | "orders"
  | "categories"
  | "engagement"
  | "trends";

const REPORT_TITLES: Record<ReportType, string> = {
  sales: "Sales performance",
  products: "Product performance",
  sellers: "Seller performance",
  customers: "Customer activity",
  orders: "Order status report",
  categories: "Popular categories",
  engagement: "Product engagement",
  trends: "Daily revenue and order trends",
};

function rangeFilter(from?: Date, to?: Date): Record<string, Date> | undefined {
  if (!from && !to) return undefined;
  const filter: Record<string, Date> = {};
  if (from) filter.$gte = from;
  if (to) filter.$lte = to;
  return filter;
}

export async function generateReport(
  type: ReportType,
  from?: Date,
  to?: Date,
): Promise<ReportResult> {
  await connectDb();
  const createdAt = rangeFilter(from, to);
  const dateMatch = createdAt ? { createdAt } : {};
  const base: Pick<ReportResult, "type" | "title" | "from" | "to"> = {
    type,
    title: REPORT_TITLES[type],
    from: from?.toISOString(),
    to: to?.toISOString(),
  };

  if (type === "sales") {
    const rows = await Order.find({ ...dateMatch, orderStatus: "delivered" })
      .sort({ deliveredAt: -1 })
      .limit(5000)
      .lean();
    const users = await loadUserMaps(rows);
    return {
      ...base,
      columns: [
        { key: "orderNumber", label: "Order" },
        { key: "date", label: "Delivered" },
        { key: "seller", label: "Seller" },
        { key: "customer", label: "Customer" },
        { key: "items", label: "Units" },
        { key: "total", label: "Total (USD)" },
      ],
      rows: rows.map((order) => ({
        orderNumber: order.orderNumber,
        date: (order.deliveredAt ?? order.createdAt).toISOString().slice(0, 10),
        seller: users.sellers.get(String(order.sellerId)) ?? "—",
        customer: users.customers.get(String(order.customerId)) ?? "—",
        items: order.items.reduce((sum, item) => sum + item.quantity, 0),
        total: order.totalCents / 100,
      })),
    };
  }

  if (type === "orders") {
    const rows = await Order.find(dateMatch).sort({ createdAt: -1 }).limit(5000).lean();
    const users = await loadUserMaps(rows);
    return {
      ...base,
      columns: [
        { key: "orderNumber", label: "Order" },
        { key: "date", label: "Placed" },
        { key: "customer", label: "Customer" },
        { key: "seller", label: "Seller" },
        { key: "status", label: "Status" },
        { key: "payment", label: "Payment" },
        { key: "total", label: "Total (USD)" },
      ],
      rows: rows.map((order) => ({
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString().slice(0, 10),
        customer: users.customers.get(String(order.customerId)) ?? "—",
        seller: users.sellers.get(String(order.sellerId)) ?? "—",
        status: order.orderStatus,
        payment: order.paymentStatus,
        total: order.totalCents / 100,
      })),
    };
  }

  if (type === "products" || type === "engagement") {
    const rows = await Product.find(dateMatch)
      .sort({ viewCount: -1 })
      .limit(5000)
      .lean();
    const users = await loadUserMaps([], rows.map((row) => String(row.sellerId)));
    const categories = await Category.find().lean();
    const categoryMap = new Map(categories.map((category) => [String(category._id), category.name]));
    return {
      ...base,
      columns: [
        { key: "name", label: "Product" },
        { key: "seller", label: "Seller" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status" },
        { key: "price", label: "Price (USD)" },
        { key: "stock", label: "Stock" },
        { key: "views", label: "Views" },
        { key: "uniqueViews", label: "Unique views" },
        { key: "likes", label: "Likes" },
        { key: "comments", label: "Comments" },
        { key: "cartAdds", label: "Cart adds" },
        { key: "sales", label: "Units sold" },
        { key: "revenue", label: "Revenue (USD)" },
      ],
      rows: rows.map((product) => ({
        name: product.name,
        seller: users.sellers.get(String(product.sellerId)) ?? "—",
        category: categoryMap.get(String(product.categoryId)) ?? "—",
        status: product.status,
        price: product.priceCents / 100,
        stock: product.stock,
        views: product.viewCount,
        uniqueViews: product.uniqueViewCount,
        likes: product.likeCount,
        comments: product.commentCount,
        cartAdds: product.cartAddCount,
        sales: product.salesCount,
        revenue: product.revenueCents / 100,
      })),
    };
  }

  if (type === "sellers") {
    const sellers = await User.find({ role: "seller" }).lean();
    const rows = await Promise.all(
      sellers.map(async (seller) => {
        const [productAgg, orderAgg] = await Promise.all([
          Product.aggregate<{ count: number; views: number; sales: number; revenue: number }>([
            { $match: { sellerId: seller._id } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                views: { $sum: "$viewCount" },
                sales: { $sum: "$salesCount" },
                revenue: { $sum: "$revenueCents" },
              },
            },
          ]),
          Order.aggregate<{ count: number; revenue: number }>([
            { $match: { sellerId: seller._id, orderStatus: "delivered" } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalCents" } } },
          ]),
        ]);
        return {
          shop: seller.shopName ?? seller.name,
          email: seller.email,
          status: seller.sellerStatus ?? "—",
          account: seller.accountStatus,
          products: productAgg[0]?.count ?? 0,
          views: productAgg[0]?.views ?? 0,
          unitsSold: productAgg[0]?.sales ?? 0,
          deliveredOrders: orderAgg[0]?.count ?? 0,
          revenue: (orderAgg[0]?.revenue ?? 0) / 100,
          joined: seller.createdAt.toISOString().slice(0, 10),
        };
      }),
    );
    return {
      ...base,
      columns: [
        { key: "shop", label: "Shop" },
        { key: "email", label: "Email" },
        { key: "status", label: "Seller status" },
        { key: "account", label: "Account" },
        { key: "products", label: "Products" },
        { key: "views", label: "Views" },
        { key: "unitsSold", label: "Units sold" },
        { key: "deliveredOrders", label: "Delivered orders" },
        { key: "revenue", label: "Revenue (USD)" },
        { key: "joined", label: "Joined" },
      ],
      rows,
    };
  }

  if (type === "customers") {
    const customers = await User.find({ role: "customer" }).lean();
    const rows = await Promise.all(
      customers.map(async (customer) => {
        const [orderAgg] = await Order.aggregate<{ count: number; total: number }>([
          { $match: { customerId: customer._id } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$totalCents" } } },
        ]);
        return {
          name: customer.name,
          email: customer.email,
          account: customer.accountStatus,
          orders: orderAgg?.count ?? 0,
          spent: (orderAgg?.total ?? 0) / 100,
          joined: customer.createdAt.toISOString().slice(0, 10),
        };
      }),
    );
    return {
      ...base,
      columns: [
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "account", label: "Account" },
        { key: "orders", label: "Orders" },
        { key: "spent", label: "Spent (USD)" },
        { key: "joined", label: "Joined" },
      ],
      rows,
    };
  }

  if (type === "categories") {
    const rows = await Category.aggregate<{
      name: string;
      products: number;
      views: number;
      sales: number;
      revenue: number;
    }>([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "categoryId",
          as: "products",
        },
      },
      {
        $project: {
          name: 1,
          products: { $size: "$products" },
          views: { $sum: "$products.viewCount" },
          sales: { $sum: "$products.salesCount" },
          revenue: { $sum: "$products.revenueCents" },
        },
      },
      { $sort: { views: -1 } },
    ]);
    return {
      ...base,
      columns: [
        { key: "name", label: "Category" },
        { key: "products", label: "Products" },
        { key: "views", label: "Views" },
        { key: "sales", label: "Units sold" },
        { key: "revenue", label: "Revenue (USD)" },
      ],
      rows: rows.map((row) => ({
        name: row.name,
        products: row.products,
        views: row.views,
        sales: row.sales,
        revenue: row.revenue / 100,
      })),
    };
  }

  const { start, keys } = buildDailyRange(30);
  const orderRows = await Order.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
  ]);
  const revenueRows = await Order.aggregate<{ _id: string; revenue: number }>([
    { $match: { orderStatus: "delivered", deliveredAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt", timezone: "UTC" } },
        revenue: { $sum: "$totalCents" },
      },
    },
  ]);
  const merged = mergeTrend(
    keys,
    orderRows.map((row) => ({ _id: row._id, orders: row.count })),
    revenueRows,
  );
  return {
    ...base,
    columns: [
      { key: "date", label: "Date" },
      { key: "orders", label: "Orders placed" },
      { key: "revenue", label: "Revenue (USD)" },
    ],
    rows: merged.map((row) => ({
      date: row.date,
      orders: row.orders,
      revenue: row.revenue,
    })),
  };
}

async function loadUserMaps(
  orders: { sellerId: Types.ObjectId; customerId: Types.ObjectId }[],
  sellerIds: string[] = [],
) {
  const ids = new Set<string>(sellerIds);
  orders.forEach((order) => {
    ids.add(String(order.sellerId));
    ids.add(String(order.customerId));
  });
  const users = await User.find({ _id: { $in: [...ids] } })
    .select("name email shopName role")
    .lean();
  const sellers = new Map<string, string>();
  const customers = new Map<string, string>();
  for (const user of users) {
    if (user.role === "seller") {
      sellers.set(String(user._id), user.shopName ?? user.name);
    } else {
      customers.set(String(user._id), user.name);
    }
    if (!sellers.has(String(user._id))) sellers.set(String(user._id), user.name);
  }
  return { sellers, customers };
}

export async function getReviewModerationQueue(limit = 50) {
  await connectDb();
  const [comments, reviews] = await Promise.all([
    Comment.find().sort({ createdAt: -1 }).limit(limit).lean(),
    Review.find().sort({ createdAt: -1 }).limit(limit).lean(),
  ]);
  const productIds = [
    ...new Set([...comments, ...reviews].map((entry) => String(entry.productId))),
  ];
  const userIds = [...new Set([...comments, ...reviews].map((entry) => String(entry.userId)))];
  const [products, users] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).select("name slug").lean(),
    User.find({ _id: { $in: userIds } }).select("name email").lean(),
  ]);
  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const userMap = new Map(users.map((user) => [String(user._id), user]));
  return {
    comments: comments.map((comment) => ({
      id: String(comment._id),
      content: comment.content,
      status: comment.status,
      createdAt: comment.createdAt.toISOString(),
      product: productMap.get(String(comment.productId)),
      author: userMap.get(String(comment.userId)),
    })),
    reviews: reviews.map((review) => ({
      id: String(review._id),
      rating: review.rating,
      content: review.content,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      product: productMap.get(String(review.productId)),
      author: userMap.get(String(review.userId)),
    })),
  };
}
