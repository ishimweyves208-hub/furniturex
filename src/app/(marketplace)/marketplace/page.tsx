import type { Metadata } from "next";
import Link from "next/link";
import { ProductListing } from "@/components/marketplace/ProductListing";
import { listActiveCategories } from "@/services/products";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse reviewed furniture from independent makers — seating, tables, storage, lighting and more. Cash on Delivery, USD pricing.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function numberParam(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const sortParam = typeof params.sort === "string" ? params.sort : "newest";
  const sort = PRODUCT_SORTS.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";
  const categories = await listActiveCategories().catch(() => []);
  const activeCategory = typeof params.category === "string" ? params.category : "";

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Marketplace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Explore Furniture
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
          Discover approved furniture from trusted sellers. Filter by category, price or availability.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/marketplace"
            className={
              activeCategory === ""
                ? "shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-medium text-white"
                : "shrink-0 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary"
            }
          >
            All furniture
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/marketplace?category=${category.slug}`}
              className={
                activeCategory === category.slug
                  ? "shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-medium text-white"
                  : "shrink-0 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary"
              }
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <ProductListing
          categories={categories}
          pathname="/marketplace"
          searchParams={params}
          query={{
            q: typeof params.q === "string" ? params.q : undefined,
            category: typeof params.category === "string" ? params.category : undefined,
            minPrice: numberParam(params.minPrice),
            maxPrice: numberParam(params.maxPrice),
            availability: typeof params.availability === "string" ? params.availability : undefined,
            featured: params.featured === "true" || undefined,
            sort,
            page,
            pageSize: 12,
          }}
        />
      </div>
    </div>
  );
}
