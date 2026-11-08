import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, Star, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Feedback";
import { requireActiveSellerPage } from "@/lib/auth/session";
import { getSellerOverview } from "@/services/analytics";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function SellerOverviewPage() {
  const user = await requireActiveSellerPage();
  const overview = await getSellerOverview(user.id);
  const metric = (label: string) => overview.metrics.find((entry) => entry.label === label)?.value ?? "0";

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Seller studio</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-text-primary">Welcome back, {user.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-sm text-text-secondary">A live view of your listings, orders and customer activity.</p>
        </div>
        <Link href="/seller/products/new" className="btn-primary btn-sm">New listing</Link>
      </div>

      {overview.pendingTasks.pendingProducts > 0 || overview.pendingTasks.pendingOrders > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {overview.pendingTasks.pendingOrders > 0 ? (
            <Link href="/seller/orders?status=pending" className="card p-4 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-sm text-text-primary"><ShoppingBag className="h-4 w-4 text-primary" /> {overview.pendingTasks.pendingOrders} order{overview.pendingTasks.pendingOrders === 1 ? "" : "s"} awaiting confirmation</span>
              <ArrowRight className="h-4 w-4 text-text-muted" />
            </Link>
          ) : null}
          {overview.pendingTasks.pendingProducts > 0 ? (
            <Link href="/seller/products?status=pending" className="card p-4 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-sm text-text-primary"><Package className="h-4 w-4 text-primary" /> {overview.pendingTasks.pendingProducts} listing{overview.pendingTasks.pendingProducts === 1 ? "" : "s"} in review</span>
              <ArrowRight className="h-4 w-4 text-text-muted" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8">
        <StatGrid>
          <StatCard label="Published" value={metric("Published")} hint="Approved listings" tone="positive" />
          <StatCard label="Pending review" value={metric("Pending approval")} hint="Awaiting moderation" tone={overview.pendingTasks.pendingProducts > 0 ? "warning" : "default"} />
          <StatCard label="Total orders" value={metric("Total orders")} hint="All time" />
          <StatCard label="Revenue" value={metric("Revenue (delivered)")} hint="Delivered orders only" tone="positive" />
          <StatCard label="Total views" value={metric("Total views")} hint={`${metric("Unique views")} unique`} />
          <StatCard label="Cart additions" value={metric("Cart additions")} hint="Purchase intent" />
          <StatCard label="Likes" value={metric("Likes")} hint="Saved by shoppers" />
          <StatCard label="Comments" value={metric("Comments")} hint="Customer questions" />
        </StatGrid>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-text-primary">Recent orders</h2>
            <Link href="/seller/orders" className="link-underline">All orders <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {overview.recentOrders.length > 0 ? (
            <div className="mt-4 table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overview.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3">
                        <Link href={`/seller/orders/${order.id}`} className="font-medium hover:underline text-text-primary">{order.orderNumber}</Link>
                        <p className="text-xs text-text-muted">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-text-primary">{order.customerName}</td>
                      <td className="px-4 py-3 text-text-primary">{formatCurrency(order.totalCents)}</td>
                      <td className="px-4 py-3"><Badge tone={order.status}>{order.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState className="mt-4" icon={<ShoppingBag className="h-6 w-6" />} title="No orders yet" description="Once a customer checks out your piece, the order appears here." />
          )}
        </section>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-text-primary">Top products</h2>
            {overview.topProducts.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {overview.topProducts.map((product) => (
                  <li key={product.productId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-text-primary">{product.name}</span>
                    <span className="shrink-0 text-xs text-text-muted">{product.views.toLocaleString()} views</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No product activity yet.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-text-primary">Latest comments</h2>
            {overview.recentComments.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {overview.recentComments.map((comment) => (
                  <li key={comment.id} className="text-sm">
                    <p className="flex items-center gap-1.5 text-xs text-text-muted"><Star className="h-3 w-3 text-primary" /> {comment.author} on {comment.productName}</p>
                    <p className="mt-1 line-clamp-3 text-text-secondary">{comment.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No comments yet.</p>
            )}
          </section>

          {overview.pendingTasks.rejectedProducts > 0 ? (
            <Link href="/seller/products?status=rejected" className="card p-4 flex items-start gap-2 border border-red-200 bg-red-50 text-red-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {overview.pendingTasks.rejectedProducts} listing{overview.pendingTasks.rejectedProducts === 1 ? "" : "s"} need changes before approval.
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
