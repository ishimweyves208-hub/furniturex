import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Truck } from "lucide-react";
import { Alert, Price } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { CancelOrderButton } from "@/components/account/CancelOrderButton";
import { requirePageUser } from "@/lib/auth/session";
import { getCustomerOrder, getCustomerOrderGroup } from "@/services/orders";
import { CUSTOMER_CANCELLABLE_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountOrderDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requirePageUser({ next: "/account/orders" });
  const { id } = await params;
  const query = await searchParams;
  const order = await getCustomerOrder(user.id, id).catch(() => null);
  if (!order) notFound();
  const group = await getCustomerOrderGroup(user.id, order.groupNumber).catch(() => [order]);
  const cancellable = CUSTOMER_CANCELLABLE_STATUSES.includes(
    order.orderStatus as (typeof CUSTOMER_CANCELLABLE_STATUSES)[number],
  );

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      {query.placed === "1" ? (
        <Alert tone="success" title="Order placed" className="mt-5">
          Thank you. The seller will confirm your order shortly. Pay in cash on delivery.
        </Alert>
      ) : null}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order {order.orderNumber}</p>
          <h1 className="mt-2 text-3xl">{order.seller?.shopName ?? "Seller order"}</h1>
          <p className="mt-2 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={order.paymentStatus}>{order.paymentStatus}</Badge>
          <Badge tone={order.orderStatus}>{order.orderStatus}</Badge>
        </div>
      </div>

      {cancellable ? (
        <div className="mt-6">
          <CancelOrderButton orderId={order.id} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3 font-display text-lg">Items</h2>
            <div className="divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.quantity} × <Price cents={item.unitPriceCents} />
                    </p>
                  </div>
                  <Price cents={item.lineTotalCents} className="text-sm" />
                </div>
              ))}
            </div>
          </section>

          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Delivery address</h2>
            <div className="mt-3 text-sm leading-relaxed text-charcoal/80">
              <p className="font-medium">{order.deliveryAddress.fullName}</p>
              <p>{order.deliveryAddress.phone}</p>
              <p className="mt-1">
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ""}
              </p>
              <p>
                {order.deliveryAddress.city}, {order.deliveryAddress.country}
              </p>
              {order.deliveryAddress.notes ? (
                <p className="mt-2 text-xs text-muted">Notes: {order.deliveryAddress.notes}</p>
              ) : null}
            </div>
          </section>

          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Status history</h2>
            <ol className="mt-4 space-y-4">
              {order.statusHistory.map((entry, index) => (
                <li key={`${entry.status}-${entry.at}`} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold">
                    {index === order.statusHistory.length - 1 ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium capitalize">{entry.status}</p>
                    <p className="text-xs text-muted">{formatDateTime(entry.at)}</p>
                    {entry.note ? <p className="mt-0.5 text-xs text-muted">{entry.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd><Price cents={order.subtotalCents} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.deliveryFeeCents === 0 ? "Free" : <Price cents={order.deliveryFeeCents} />}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-medium"><dt>Total</dt><dd><Price cents={order.totalCents} /></dd></div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Cash on Delivery. Payment status changes to paid when the order is marked delivered.
            </p>
          </div>

          <div className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Seller</h2>
            {order.seller?.shopSlug ? (
              <Link href={`/shop/${order.seller.shopSlug}`} className="mt-2 inline-block text-sm underline underline-offset-4">
                {order.seller.shopName}
              </Link>
            ) : (
              <p className="mt-2 text-sm">{order.seller?.shopName ?? "Seller"}</p>
            )}
            <Link href="/contact" className={buttonClasses("outline", "sm", "mt-4 w-full")}>
              Contact support
            </Link>
          </div>

          {group.length > 1 ? (
            <div className="border border-line bg-white p-5">
              <h2 className="font-display text-lg">Order group</h2>
              <p className="mt-1 text-xs text-muted">
                This checkout included items from {group.length} sellers. Each is fulfilled separately.
              </p>
              <ul className="mt-3 space-y-2">
                {group.filter((entry) => entry.id !== order.id).map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/account/orders/${entry.id}`} className="text-xs text-charcoal underline underline-offset-4">
                      {entry.orderNumber} · {entry.seller?.shopName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
