import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Armchair } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { listActiveCategories } from "@/services/products";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse furniture by category — sofas, beds, chairs, tables, storage, office and outdoor.",
};

export default async function CategoriesPage() {
  const categories = await listActiveCategories().catch(() => []);

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Categories</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Find the right piece for every room.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
          Browse reviewed furniture by category, from deep sofas and solid timber tables to quiet
          storage and outdoor seating.
        </p>
      </div>

      <div className="mt-8">
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-primary/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-background-alternate">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-text-muted">
                      <Armchair className="h-7 w-7" />
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <h2 className="text-sm font-medium text-text-primary">{category.name}</h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {category.productCount ?? 0} pieces
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Armchair className="h-7 w-7" />}
            title="Categories are being prepared"
            description="Furniture categories will appear here once they are published."
            action={
              <Link href="/marketplace" className="btn-primary btn-md">
                Browse marketplace
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
