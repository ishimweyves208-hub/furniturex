import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Feedback";
import { CheckoutForm } from "@/components/marketplace/CheckoutForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart } from "@/services/cart";
import { listAddresses } from "@/services/addresses";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login?next=/checkout");

  const cart = await getCart(user.id).catch((error) => {
    console.error("[checkout] failed to load cart", error);
    return null;
  });
  if (!cart) {
    return (
      <div className="container py-16">
        <Alert tone="warning" title="Checkout is unavailable">
          The marketplace database is not configured yet. Please try again later.
        </Alert>
      </div>
    );
  }
  if (cart.items.length === 0) redirect("/cart");
  if (cart.hasIssues) redirect("/cart");

  const addresses = await listAddresses(user.id).catch(() => []);

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Complete your order</h1>
        <p className="mt-2 text-sm text-text-secondary">
          No online payment required. Pay in cash when your furniture arrives.
        </p>
      </div>
      <div className="mt-8">
        <CheckoutForm cart={cart} addresses={addresses} defaultName={user.name} />
      </div>
    </div>
  );
}
