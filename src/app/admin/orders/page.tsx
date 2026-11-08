import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { listAdminOrders } from "@/services/orders";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const status = typeof params.status === "string" && ORDER_STATUSES.includes(params.status as never) ? params.status : undefined;
  const payment = typeof params.payment === "string" && PAYMENT_STATUSES.includes(params.payment as never) ? params.payment : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const result = await listAdminOrders({ page, pageSize: 20, status, payment, q });

  return (
    <div>
      <div>
        <p className="eyebrow">Transactions</p>
        <h1 className="mt-2 text-3xl">Orders</h1>
        <p className="mt-2 text-sm text-muted">{result.total} seller order{result.total === 1 ? "" : "s"} across the marketplace.</p>
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Order or group number" className="min-w-[13rem] flex-1 border border-line bg-white px-3 py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="border border-line bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (<option key={value} value={value}>{value}</option>))}
        </select>
        <select name="payment" defaultValue={payment ?? ""} className="border border-line bg-white px-3 py-2 text-sm">
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((value) => (<option key={value} value={value}>{value}</option>))}
        </select>
        <button type="submit" className={buttonClasses("outline", "sm")}>Filter</button>
      </form>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Seller</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">{order.orderNumber}</Link>
                    <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">{order.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3">{order.seller?.shopName ?? "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(order.totalCents)}</td>
                  <td className="px-4 py-3"><Badge tone={order.paymentStatus}>{order.paymentStatus}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={order.orderStatus}>{order.orderStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState className="mt-6" icon={<ShoppingBag className="h-7 w-7" />} title="No orders found" description="Try changing the filters." />
      )}

      <Pagination page={result.page} totalPages={result.totalPages} pathname="/admin/orders" searchParams={params} />
    </div>
  );
}
