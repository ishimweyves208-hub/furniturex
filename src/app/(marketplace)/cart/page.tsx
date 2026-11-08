import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { Alert, EmptyState, Price } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { CartItemControls } from "@/components/marketplace/CartItemControls";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart } from "@/services/cart";
import { getPlatformSettings } from "@/services/settings";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default async function CartPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Sign in to view your cart"
          description="Your cart is linked to your FurnitureX account so it is available on every device."
          action={
            <Link href="/login?next=/cart" className={buttonClasses("primary")}>
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  const [cart, settings] = await Promise.all([
    getCart(user.id).catch((error) => {
      console.error("[cart] failed to load cart", error);
      return null;
    }),
    getPlatformSettings().catch(() => null),
  ]);

  if (!cart) {
    return (
      <div className="container py-16">
        <Alert tone="warning" title="Your cart could not load">
          The marketplace is not fully configured yet. Please try again shortly.
        </Alert>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Your cart is empty"
          description="Browse the marketplace and add pieces you are considering."
          action={
            <Link href="/marketplace" className={buttonClasses("primary")}>
              Browse furniture
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your selection</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Cart</h1>
        </div>
        <Link href="/marketplace" className="link-underline">
          Continue browsing <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {cart.hasIssues ? (
        <Alert tone="warning" title="Some items need attention" className="mt-8">
          One or more pieces are unavailable or exceed current stock. Update quantities or remove them
          before checkout.
        </Alert>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="divide-y divide-border rounded-xl border border-border">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex gap-5 py-6">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-background-alternate sm:h-32 sm:w-28">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    {item.slug ? (
                      <Link href={`/product/${item.slug}`} className="text-base font-medium hover:text-primary">
                        {item.name}
                      </Link>
                    ) : (
                      <p className="text-base font-medium">{item.name}</p>
                    )}
                    <p className="mt-0.5 text-xs text-text-secondary">Sold by {item.sellerName}</p>
                  </div>
                  <Price cents={item.lineTotalCents} className="text-sm font-medium" />
                </div>
                {!item.available ? (
                  <p className="text-xs text-danger">{item.issue ?? "Unavailable"}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  <CartItemControls
                    productId={item.productId}
                    quantity={item.quantity}
                    stock={item.stock}
                    available={item.available}
                  />
                  <p className="text-xs text-text-secondary">
                    {formatCurrency(item.unitPriceCents)} each
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>
                  <Price cents={cart.subtotalCents} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>
                  {cart.deliveryFeeCents === 0 ? "Free" : <Price cents={cart.deliveryFeeCents} />}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd>
                  <Price cents={cart.totalCents} />
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Cash on Delivery. Orders from different sellers are fulfilled separately.
              {settings && settings.freeDeliveryThresholdCents > 0
                ? ` Delivery is free over ${formatCurrency(settings.freeDeliveryThresholdCents)} per seller.`
                : ""}
            </p>
            <Link
              href="/checkout"
              className={buttonClasses("primary", "lg", "mt-6 w-full")}
              aria-disabled={cart.hasIssues}
            >
              Proceed to checkout
            </Link>
            {cart.hasIssues ? (
              <p className="mt-2 text-xs text-danger">
                Resolve unavailable items before continuing.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
