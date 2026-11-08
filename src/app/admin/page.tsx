import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { getAdminOverview } from "@/services/analytics";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const metric = (label: string) => overview.metrics.find((entry) => entry.label === label)?.value ?? "0";
  const maxOrders = Math.max(1, ...overview.trend.map((point) => point.orders));

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Platform health</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-text-primary">Administration</h1>
          <p className="mt-2 text-sm text-text-secondary">Marketplace activity, moderation queues and revenue at a glance.</p>
        </div>
        {overview.pendingApprovals > 0 ? (
          <Link href="/admin/approvals" className="btn-primary btn-sm">
            Review {overview.pendingApprovals} pending
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-700"><ShieldCheck className="h-4 w-4" /> Queue clear</span>
        )}
      </div>

      <div className="mt-8">
        <StatGrid>
          <StatCard label="Total users" value={metric("Total users")} hint={`${overview.userCounts.sellers} sellers · ${overview.userCounts.customers} customers`} />
          <StatCard label="Products" value={metric("Total products")} hint={`${metric("Approved products")} approved`} />
          <StatCard label="Pending review" value={metric("Pending products")} hint="Listings awaiting moderation" tone={overview.pendingApprovals > 0 ? "warning" : "default"} />
          <StatCard label="Orders" value={metric("Total orders")} hint={`${metric("Delivered orders")} delivered`} />
          <StatCard label="Revenue" value={metric("Revenue (delivered)")} hint="Delivered orders only" tone="positive" />
          <StatCard label="Completed sales" value={metric("Completed sales")} hint="Paid orders" tone="positive" />
          <StatCard label="Cancelled orders" value={metric("Cancelled orders")} hint="All time" />
          <StatCard label="Superadmins" value={String(overview.userCounts.superadmins)} hint="Platform operators" />
        </StatGrid>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-text-primary">Orders · last 30 days</h2>
            <span className="text-xs text-text-muted">Peak {maxOrders}</span>
          </div>
          <div className="mt-6 flex h-32 items-end gap-1">
            {overview.trend.map((point) => (
              <div key={point.date} className="group relative flex-1" title={`${point.date}: ${point.orders} orders`}>
                <div className="w-full bg-text-primary transition-colors group-hover:bg-primary" style={{ height: `${Math.max(2, (point.orders / maxOrders) * 120)}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-text-muted">
            <span>{overview.trend[0]?.date}</span>
            <span>{overview.trend[overview.trend.length - 1]?.date}</span>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-text-primary">Top categories</h2>
            <Link href="/admin/categories" className="link-underline text-xs">Manage</Link>
          </div>
          <ul className="mt-4 space-y-2">
            {overview.topCategories.map((category) => (
              <li key={category.name} className="flex justify-between text-sm">
                <span className="text-text-primary">{category.name}</span>
                <span className="text-text-secondary">{category.products} approved</span>
              </li>
            ))}
            {overview.topCategories.length === 0 ? <li className="text-sm text-text-muted">No categories yet.</li> : null}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-text-primary">Recent orders</h2>
            <Link href="/admin/orders" className="link-underline text-xs">All orders <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mt-4 divide-y divide-border border border-border">
            {overview.recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-bg-hover">
                <div>
                  <p className="font-medium text-text-primary">{order.orderNumber}</p>
                  <p className="text-xs text-text-muted">{order.customerName} · {formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-primary">{formatCurrency(order.totalCents)}</span>
                  <Badge tone={order.status}>{order.status}</Badge>
                </div>
              </Link>
            ))}
            {overview.recentOrders.length === 0 ? <p className="px-4 py-6 text-sm text-text-muted">No orders yet.</p> : null}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-text-primary">Recent activity</h2>
            <Link href="/admin/audit" className="link-underline text-xs">Audit log <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mt-4 divide-y divide-border border border-border">
            {overview.recentAudit.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="text-text-primary">{entry.action}</p>
                  <p className="text-xs text-text-muted">{entry.actorEmail ?? "System"} · {entry.targetType}</p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">{formatDateTime(entry.createdAt)}</span>
              </div>
            ))}
            {overview.recentAudit.length === 0 ? <p className="px-4 py-6 text-sm text-text-muted">No audit entries yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
