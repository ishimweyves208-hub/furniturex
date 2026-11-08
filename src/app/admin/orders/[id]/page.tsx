import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Feedback";
import { AdminOrderStatus } from "@/components/admin/AdminOrderStatus";
import { getAdminOrder } from "@/services/orders";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order detail" };

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const order = await getAdminOrder(id).catch(() => null);
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> Orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{order.groupNumber}</p>
          <h1 className="mt-2 text-3xl">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted">
            {order.customer?.name} · {order.seller?.shopName} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={order.paymentStatus}>{order.paymentStatus}</Badge>
          <Badge tone={order.orderStatus}>{order.orderStatus}</Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3 font-display text-lg">Items</h2>
            <div className="divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted">{item.quantity} × <Price cents={item.unitPriceCents} /></p>
                  </div>
                  <Price cents={item.lineTotalCents} />
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><Price cents={order.subtotalCents} /></div>
              <div className="flex justify-between"><span className="text-muted">Delivery</span><Price cents={order.deliveryFeeCents} /></div>
              <div className="flex justify-between border-t border-line pt-2 font-medium"><span>Total</span><Price cents={order.totalCents} /></div>
            </div>
          </section>

          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Delivery</h2>
            <div className="mt-3 text-sm leading-relaxed text-charcoal/80">
              <p className="font-medium">{order.deliveryAddress.fullName}</p>
              <p>{order.deliveryAddress.phone}</p>
              <p className="mt-1">{order.deliveryAddress.addressLine1}{order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ""}</p>
              <p>{order.deliveryAddress.city}, {order.deliveryAddress.country}</p>
            </div>
          </section>

          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">History</h2>
            <ol className="mt-4 space-y-3">
              {order.statusHistory.map((entry) => (
                <li key={`${entry.status}-${entry.at}`} className="border-l-2 border-gold/40 pl-3">
                  <p className="text-sm font-medium capitalize">{entry.status}</p>
                  <p className="text-xs text-muted">{formatDateTime(entry.at)}{entry.note ? ` · ${entry.note}` : ""}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Update status</h2>
            <div className="mt-4"><AdminOrderStatus orderId={order.id} status={order.orderStatus} /></div>
          </section>
          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Parties</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted">Customer</p>
                <p>{order.customer?.name}</p>
                <p className="text-xs text-muted">{order.customer?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Seller</p>
                <p>{order.seller?.shopName}</p>
                {order.seller?.shopSlug ? (
                  <Link href={`/shop/${order.seller.shopSlug}`} className="text-xs underline underline-offset-4">View shop</Link>
                ) : null}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
