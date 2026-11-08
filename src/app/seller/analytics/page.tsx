import type { Metadata } from "next";
import Link from "next/link";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { requireActiveSellerPage } from "@/lib/auth/session";
import { getSellerAnalytics } from "@/services/analytics";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SellerAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireActiveSellerPage();
  const params = await searchParams;
  const days = Math.min(Math.max(Number.parseInt(typeof params.days === "string" ? params.days : "30", 10) || 30, 7), 180);
  const analytics = await getSellerAnalytics(user.id, days);
  const maxViews = Math.max(1, ...analytics.trend.map((point) => point.views));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Performance</p>
          <h1 className="mt-2 text-3xl">Analytics</h1>
          <p className="mt-2 text-sm text-muted">Views, purchase intent and delivered revenue for the last {days} days.</p>
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((value) => (
            <Link
              key={value}
              href={`/seller/analytics?days=${value}`}
              className={buttonClasses(days === value ? "primary" : "outline", "sm")}
            >
              {value}d
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <StatGrid>
          <StatCard label="Views" value={analytics.totals.views.toLocaleString()} hint={`${analytics.totals.uniqueViews.toLocaleString()} unique`} />
          <StatCard label="Cart additions" value={analytics.totals.cartAdds.toLocaleString()} hint="Added to cart" />
          <StatCard label="Orders" value={analytics.totals.orders.toLocaleString()} hint="All time" />
          <StatCard label="Delivered sales" value={analytics.totals.sales.toLocaleString()} hint="Units sold" tone="positive" />
          <StatCard label="Revenue" value={formatCurrency(analytics.totals.revenue * 100)} hint="Delivered orders" tone="positive" />
        </StatGrid>
      </div>

      <section className="mt-8 border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Daily views</h2>
          <p className="text-xs text-muted">Peak {maxViews.toLocaleString()} views</p>
        </div>
        <div className="mt-6 flex h-40 items-end gap-1">
          {analytics.trend.map((point) => (
            <div key={point.date} className="group relative flex-1">
              <div
                className="w-full bg-charcoal/80 transition-colors group-hover:bg-gold"
                style={{ height: `${Math.max(2, (point.views / maxViews) * 150)}px` }}
                title={`${point.date}: ${point.views} views`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted">
          <span>{analytics.trend[0]?.date}</span>
          <span>{analytics.trend[analytics.trend.length - 1]?.date}</span>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl">Product performance</h2>
        {analytics.products.length > 0 ? (
          <div className="mt-4 overflow-x-auto border border-line bg-white">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Views</th>
                  <th className="px-4 py-3 font-semibold">Sales</th>
                  <th className="px-4 py-3 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {analytics.products.map((product) => (
                  <tr key={product.productId}>
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.views.toLocaleString()}</td>
                    <td className="px-4 py-3">{product.sales.toLocaleString()}</td>
                    <td className="px-4 py-3">{formatCurrency(product.revenue * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState className="mt-4" title="No product data yet" description="Publish listings and share them to start collecting views." />
        )}
      </section>
    </div>
  );
}
