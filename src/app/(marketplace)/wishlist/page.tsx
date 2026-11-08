import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { EmptyState } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { requirePageUser } from "@/lib/auth/session";
import { listWishlist } from "@/services/wishlist";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: false } };

export default async function WishlistPage() {
  const user = await requirePageUser({ next: "/wishlist" });
  const items = await listWishlist(user.id).catch((error) => {
    console.error("[wishlist] failed to load", error);
    return [];
  });
  const wishedIds = new Set(items.map((item) => item.id));

  return (
    <div className="container py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Saved</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Wishlist
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {items.length > 0
              ? `${items.length} saved ${items.length === 1 ? "product" : "products"}.`
              : "Keep track of furniture you are considering."}
          </p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
        >
          Browse marketplace
        </Link>
      </div>

      <div className="mt-8">
        {items.length > 0 ? (
          <ProductGrid products={items} wishedIds={wishedIds} />
        ) : (
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title="Nothing saved yet"
            description="Tap the heart on any listing to keep it here while you decide."
            action={
              <Link href="/marketplace" className={buttonClasses("primary")}>
                Discover furniture
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
