import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, Store } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { listPublicSellers } from "@/services/products";

export const metadata: Metadata = {
  title: "Sellers",
  description:
    "Meet the independent studios and workshops making reviewed furniture on FurnitureX.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SellersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const sellers = await listPublicSellers(q).catch((error) => {
    console.error("[sellers] failed to load sellers", error);
    return [];
  });

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Sellers</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Trusted furniture sellers
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
          Browse independent studios and workshops, then explore their approved furniture.
        </p>
      </div>

      <form method="get" className="mt-6 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search sellers"
            className="input pl-9"
          />
        </div>
        <button type="submit" className={buttonClasses("primary")}>
          Search
        </button>
      </form>

      <div className="mt-8">
        {sellers.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sellers.map((seller) => (
              <Link
                key={seller.id}
                href={`/shop/${seller.shopSlug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-primary/30"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-background-alternate">
                  {seller.shopLogo ? (
                    <Image
                      src={seller.shopLogo}
                      alt={seller.shopName}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-text-muted">
                      <Store className="h-8 w-8" />
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-medium text-primary">
                    {seller.productCount ?? 0} products
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-text-primary">{seller.shopName}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                    {seller.shopDescription ?? "Independent furniture studio on FurnitureX."}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-text-muted">
                    <span>Since {new Date(seller.memberSince).getFullYear()}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      Visit shop <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Store className="h-7 w-7" />}
            title={q ? `No sellers match “${q}”` : "Seller storefronts are on their way"}
            description="Independent studios will appear here once their first listings are approved."
            action={
              <Link href="/register?role=seller" className={buttonClasses("outline")}>
                Apply to sell on FurnitureX
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
