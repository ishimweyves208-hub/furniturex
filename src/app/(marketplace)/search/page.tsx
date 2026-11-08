import type { Metadata } from "next";
import { ProductListing } from "@/components/marketplace/ProductListing";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Search",
  description: "Search reviewed furniture from independent makers on FurnitureX.",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const sortParam = typeof params.sort === "string" ? params.sort : "newest";
  const sort = PRODUCT_SORTS.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Search</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          {q ? `Results for “${q}”` : "Find your next piece"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
          Search by furniture name, material or room. Every result is an approved listing from a
          trusted seller.
        </p>
      </div>
      <div className="mt-8">
        <ProductListing
          pathname="/search"
          searchParams={params}
          query={{
            q: q || undefined,
            category: typeof params.category === "string" ? params.category : undefined,
            minPrice:
              typeof params.minPrice === "string"
                ? Number.parseFloat(params.minPrice) || undefined
                : undefined,
            maxPrice:
              typeof params.maxPrice === "string"
                ? Number.parseFloat(params.maxPrice) || undefined
                : undefined,
            sort,
            page,
            pageSize: 12,
          }}
          emptyTitle={q ? `No results for “${q}”` : "Start with a search"}
          emptyDescription="Try a broader term such as “oak”, “dining” or “lounge chair”, or browse the full marketplace."
        />
      </div>
    </div>
  );
}
