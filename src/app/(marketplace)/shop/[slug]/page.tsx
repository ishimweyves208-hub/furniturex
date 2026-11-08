import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Store } from "lucide-react";
import { ProductListing } from "@/components/marketplace/ProductListing";
import { getSellerShopBySlug } from "@/services/products";
import { formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getSellerShopBySlug(slug).catch(() => null);
  if (!shop) return { title: "Shop" };
  return {
    title: shop.seller.shopName,
    description: shop.seller.shopDescription ?? `Shop furniture from ${shop.seller.shopName} on FurnitureX.`,
    alternates: { canonical: `/shop/${shop.seller.shopSlug}` },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const shop = await getSellerShopBySlug(slug).catch(() => null);
  if (!shop) notFound();

  const page = Math.max(1, Number.parseInt(typeof filters.page === "string" ? filters.page : "1", 10) || 1);
  const listingSearchParams = { ...filters, seller: slug };

  return (
    <div>
      <section className="border-b border-border">
        <div className="container grid gap-6 py-8 sm:grid-cols-[8rem_1fr] sm:items-center sm:py-10">
          <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-background-alternate sm:h-32 sm:w-32">
            {shop.seller.shopLogo ? (
              <Image
                src={shop.seller.shopLogo}
                alt={shop.seller.shopName}
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-text-muted">
                <Store className="h-9 w-9" />
              </span>
            )}
          </div>
          <div>
            <p className="eyebrow">Seller shop</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {shop.seller.shopName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
              {shop.seller.shopDescription ?? "Independent furniture studio on FurnitureX."}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted">
              <span>{shop.seller.productCount ?? 0} products</span>
              <span>Member since {formatDate(shop.seller.memberSince)}</span>
              <span>Listings reviewed by FurnitureX</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8 sm:py-10">
        <ProductListing
          pathname={`/shop/${slug}`}
          searchParams={listingSearchParams}
          query={{
            seller: slug,
            q: typeof filters.q === "string" ? filters.q : undefined,
            category: typeof filters.category === "string" ? filters.category : undefined,
            minPrice:
              typeof filters.minPrice === "string" ? Number.parseFloat(filters.minPrice) || undefined : undefined,
            maxPrice:
              typeof filters.maxPrice === "string" ? Number.parseFloat(filters.maxPrice) || undefined : undefined,
            availability: typeof filters.availability === "string" ? filters.availability : undefined,
            sort:
              filters.sort === "price-asc" || filters.sort === "price-desc" || filters.sort === "popular"
                ? filters.sort
                : "newest",
            page,
            pageSize: 12,
          }}
          emptyTitle={`${shop.seller.shopName} has no matching pieces`}
          emptyDescription="Try clearing your filters or browse the full marketplace."
        />
      </div>
    </div>
  );
}
