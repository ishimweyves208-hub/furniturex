import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/marketplace/ProductListing";
import { listActiveCategories } from "@/services/products";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function numberParam(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listActiveCategories().catch(() => []);
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description:
      category.description ??
      `Shop ${category.name.toLowerCase()} from independent furniture makers on FurnitureX.`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const categories = await listActiveCategories().catch(() => []);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const page = Math.max(1, Number.parseInt(typeof filters.page === "string" ? filters.page : "1", 10) || 1);
  const sortParam = typeof filters.sort === "string" ? filters.sort : "newest";
  const sort = PRODUCT_SORTS.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Category</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          {category.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
          {category.description ??
            `Reviewed ${category.name.toLowerCase()} from independent furniture studios on FurnitureX.`}
        </p>
      </div>
      <div className="mt-8">
        <ProductListing
          pathname={`/category/${category.slug}`}
          searchParams={filters}
          categories={categories}
          hideCategory
          query={{
            q: typeof filters.q === "string" ? filters.q : undefined,
            category: category.slug,
            minPrice: numberParam(filters.minPrice),
            maxPrice: numberParam(filters.maxPrice),
            availability: typeof filters.availability === "string" ? filters.availability : undefined,
            sort,
            page,
            pageSize: 12,
          }}
        />
      </div>
    </div>
  );
}
