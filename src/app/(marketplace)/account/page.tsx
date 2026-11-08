import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { buttonClasses } from "@/components/ui/Button";
import { requirePageUser } from "@/lib/auth/session";
import { customerOrderStats, listCustomerOrders } from "@/services/orders";
import { listWishlist } from "@/services/wishlist";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function AccountOverviewPage() {
  const user = await requirePageUser({ next: "/account" });
  const [stats, orders, wishlist] = await Promise.all([
    customerOrderStats(user.id).catch(() => ({ total: 0, active: 0, delivered: 0, spentCents: 0 })),
    listCustomerOrders(user.id, { pageSize: 4 }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 0 })),
    listWishlist(user.id).catch(() => []),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-2 text-3xl">Hello, {user.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-sm text-muted">
            Track orders, manage addresses and keep the pieces you are considering.
          </p>
        </div>
        <Link href="/marketplace" className={buttonClasses("outline", "sm")}>
          Continue browsing
        </Link>
      </div>

      {!user.emailVerified ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-warning/30 bg-warning/5 p-4 text-sm text-amber-700">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Your email is not verified yet.
          </span>
          <Link href="/account/profile" className="underline underline-offset-4">
            Manage verification
          </Link>
        </div>
      ) : null}

      <div className="mt-8">
        <StatGrid>
          <StatCard label="Total orders" value={String(stats.total)} hint="All orders placed" />
          <StatCard label="Active" value={String(stats.active)} hint="Pending, confirmed or shipped" tone={stats.active > 0 ? "warning" : "default"} />
          <StatCard label="Delivered" value={String(stats.delivered)} hint="Completed orders" tone="positive" />
          <StatCard label="Total spent" value={formatCurrency(stats.spentCents)} hint="Delivered orders only" />
        </StatGrid>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recent orders</h2>
            <Link href="/account/orders" className="link-underline">
              All orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {orders.items.length > 0 ? (
              orders.items.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 border border-line bg-white p-4 transition-colors hover:border-charcoal/30"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(order.createdAt)} · {order.items.length} item
                      {order.items.length === 1 ? "" : "s"} · {order.seller?.shopName ?? "Seller"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{formatCurrency(order.totalCents)}</span>
                    <Badge tone={order.orderStatus}>{order.orderStatus}</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="border border-dashed border-line p-8 text-center text-sm text-muted">
                <ShoppingBag className="mx-auto h-6 w-6" />
                <p className="mt-2">No orders yet.</p>
                <Link href="/marketplace" className="mt-2 inline-block text-charcoal underline underline-offset-4">
                  Find your first piece
                </Link>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="border border-line bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4 text-gold" /> Cash on Delivery
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Orders are paid in cash when delivered. Keep your phone reachable for the courier.
            </p>
          </div>
          <div className="border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Wishlist</p>
              <span className="text-xs text-muted">{wishlist.length} saved</span>
            </div>
            {wishlist.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {wishlist.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <Link href={`/product/${item.slug}`} className="text-xs text-muted hover:text-charcoal">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">Save pieces to revisit them here.</p>
            )}
            <Link href="/wishlist" className="mt-3 inline-block text-xs text-charcoal underline underline-offset-4">
              View wishlist
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
