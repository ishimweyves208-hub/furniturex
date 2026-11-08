import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { requirePageUser } from "@/lib/auth/session";
import { listCustomerOrders } from "@/services/orders";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageUser({ next: "/account/orders" });
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const status = typeof params.status === "string" && ORDER_STATUSES.includes(params.status as never)
    ? params.status
    : undefined;
  const result = await listCustomerOrders(user.id, { page, pageSize: 10, status }).catch((error) => {
    console.error("[account/orders] failed to load", error);
    return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Purchases</p>
          <h1 className="mt-2 text-3xl">Your orders</h1>
          <p className="mt-2 text-sm text-muted">Track fulfilment, payment and delivery status.</p>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <button type="submit" className={buttonClasses("outline", "sm")}>Filter</button>
      </form>

      <div className="mt-6 space-y-4">
        {result.items.length > 0 ? (
          result.items.map((order) => (
            <article key={order.id} className="border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 text-xs">
                <div>
                  <span className="font-medium text-charcoal">{order.orderNumber}</span>
                  <span className="mx-2 text-muted">·</span>
                  <span className="text-muted">{formatDate(order.createdAt)}</span>
                  <span className="mx-2 text-muted">·</span>
                  <span className="text-muted">{order.seller?.shopName ?? "Seller"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={order.paymentStatus}>{order.paymentStatus}</Badge>
                  <Badge tone={order.orderStatus}>{order.orderStatus}</Badge>
                </div>
              </div>
              <div className="space-y-3 px-4 py-4">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-sand">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.name}</p>
                      <p className="text-xs text-muted">Qty {item.quantity} · {formatCurrency(item.unitPriceCents)} each</p>
                    </div>
                    <p className="text-sm">{formatCurrency(item.lineTotalCents)}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
                <p className="text-sm">
                  Total <span className="font-medium">{formatCurrency(order.totalCents)}</span>
                </p>
                <Link href={`/account/orders/${order.id}`} className={buttonClasses("outline", "sm")}>
                  View order
                </Link>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            icon={<ShoppingBag className="h-7 w-7" />}
            title={status ? `No ${status} orders` : "No orders yet"}
            description="When you place an order it will appear here with delivery updates."
            action={
              <Link href="/marketplace" className={buttonClasses("primary")}>
                Browse furniture
              </Link>
            }
          />
        )}
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        pathname="/account/orders"
        searchParams={params}
      />
    </div>
  );
}
