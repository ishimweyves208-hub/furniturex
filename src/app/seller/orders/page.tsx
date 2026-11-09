import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { requireActiveSellerPage } from "@/lib/auth/session";
import { listSellerOrders } from "@/services/orders";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SellerOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireActiveSellerPage();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const status = typeof params.status === "string" && ORDER_STATUSES.includes(params.status as never)
    ? params.status
    : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const result = await listSellerOrders(user.id, { page, pageSize: 20, status, q });

  return (
    <div>
      <div>
        <p className="eyebrow">Fulfilment</p>
        <h1 className="mt-2 text-3xl">Orders</h1>
        <p className="mt-2 text-sm text-muted">{result.total} order{result.total === 1 ? "" : "s"} placed with your shop.</p>
      </div>

      <form method="get" className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input name="q" defaultValue={q} placeholder="Order number" className="w-full border border-line bg-white px-3 py-2 text-sm sm:min-w-[12rem] sm:flex-1" />
        <select name="status" defaultValue={status ?? ""} className="w-full border border-line bg-white px-3 py-2 text-sm sm:w-auto">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (<option key={value} value={value}>{value}</option>))}
        </select>
        <button type="submit" className={buttonClasses("outline", "sm", "justify-center")}>Filter</button>
      </form>

      {result.items.length > 0 ? (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {result.items.map((order) => (
              <div key={order.id} className="border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/seller/orders/${order.id}`} className="font-medium hover:underline">{order.orderNumber}</Link>
                    <p className="text-xs text-muted">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium">{formatCurrency(order.totalCents)}</p>
                </div>
                <p className="mt-2 truncate text-xs text-muted">{order.customer?.name ?? "Customer"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={order.paymentStatus}>{order.paymentStatus}</Badge>
                  <Badge tone={order.orderStatus}>{order.orderStatus}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 hidden overflow-x-auto border border-line bg-white md:block">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link href={`/seller/orders/${order.id}`} className="font-medium hover:underline">{order.orderNumber}</Link>
                    <p className="text-xs text-muted">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                  </td>
                  <td className="px-4 py-3">{order.customer?.name ?? "Customer"}</td>
                  <td className="px-4 py-3">{formatCurrency(order.totalCents)}</td>
                  <td className="px-4 py-3"><Badge tone={order.paymentStatus}>{order.paymentStatus}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={order.orderStatus}>{order.orderStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <EmptyState className="mt-6" icon={<ShoppingBag className="h-7 w-7" />} title={status ? `No ${status} orders` : "No orders yet"} description="Orders for your listings will appear here." />
      )}

      <Pagination page={result.page} totalPages={result.totalPages} pathname="/seller/orders" searchParams={params} />
    </div>
  );
}
