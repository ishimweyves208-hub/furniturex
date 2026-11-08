import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Input";
import { buttonClasses } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/session";
import { getWishlistIds } from "@/services/wishlist";
import { listActiveCategories, listPublicProducts, type ProductQuery } from "@/services/products";
import type { CategoryDTO } from "@/types";

export async function ProductListing({
  query,
  pathname,
  searchParams,
  categories: providedCategories,
  hideCategory = false,
  emptyTitle = "No pieces match these filters",
  emptyDescription = "Try widening your search, adjusting the price range, or browsing all furniture.",
}: {
  query: ProductQuery;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
  categories?: CategoryDTO[];
  hideCategory?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [result, categories, user] = await Promise.all([
    listPublicProducts(query),
    providedCategories ? Promise.resolve(providedCategories) : listActiveCategories().catch(() => []),
    getCurrentUser().catch(() => null),
  ]);
  const wishedIds = user
    ? await getWishlistIds(user.id, result.items.map((item) => item.id)).catch(() => new Set<string>())
    : new Set<string>();

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <form
          method="get"
          action={pathname}
          className="space-y-5 rounded-xl border border-border bg-background p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
          </div>

          <div>
            <label htmlFor="q" className="form-label">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <Input
                id="q"
                name="q"
                defaultValue={typeof searchParams.q === "string" ? searchParams.q : ""}
                placeholder="Tables, walnut, lounge…"
                className="pl-9"
              />
            </div>
          </div>

          {!hideCategory ? (
            <div>
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <Select
                id="category"
                name="category"
                defaultValue={typeof searchParams.category === "string" ? searchParams.category : ""}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div>
            <label htmlFor="sort" className="form-label">
              Sort by
            </label>
            <Select
              id="sort"
              name="sort"
              defaultValue={typeof searchParams.sort === "string" ? searchParams.sort : "newest"}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most viewed</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </Select>
          </div>

          <div>
            <p className="form-label">Price (USD)</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="minPrice"
                name="minPrice"
                type="number"
                min={0}
                step="1"
                aria-label="Minimum price"
                defaultValue={typeof searchParams.minPrice === "string" ? searchParams.minPrice : ""}
                placeholder="Min"
              />
              <Input
                id="maxPrice"
                name="maxPrice"
                type="number"
                min={0}
                step="1"
                aria-label="Maximum price"
                defaultValue={typeof searchParams.maxPrice === "string" ? searchParams.maxPrice : ""}
                placeholder="Max"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="availability"
              value="in-stock"
              defaultChecked={searchParams.availability === "in-stock"}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            In stock only
          </label>

          {searchParams.featured === "true" ? <input type="hidden" name="featured" value="true" /> : null}
          {typeof searchParams.seller === "string" ? (
            <input type="hidden" name="seller" value={searchParams.seller} />
          ) : null}
          {hideCategory && typeof searchParams.category === "string" ? (
            <input type="hidden" name="category" value={searchParams.category} />
          ) : null}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className={buttonClasses("primary", "md", "flex-1")}>
              Apply filters
            </button>
            <Link
              href={pathname}
              className="text-xs font-medium text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
            >
              Clear
            </Link>
          </div>
        </form>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{result.total}</span>{" "}
            {result.total === 1 ? "product" : "products"}
          </p>
          {typeof searchParams.q === "string" && searchParams.q ? (
            <p className="text-sm text-text-secondary">
              Results for <span className="text-text-primary">“{searchParams.q}”</span>
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          {result.items.length > 0 ? (
            <ProductGrid products={result.items} wishedIds={wishedIds} />
          ) : (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={
                <Link href="/marketplace" className={buttonClasses("primary")}>
                  Browse all furniture
                </Link>
              }
            />
          )}
        </div>

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          pathname={pathname}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
