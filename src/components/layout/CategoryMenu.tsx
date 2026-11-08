"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { CategoryDTO } from "@/types";
import { cn } from "@/lib/utils";

export function CategoryMenu({ categories }: { categories: CategoryDTO[] }) {
  if (categories.length === 0) {
    return (
      <Link href="/marketplace" className="px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary rounded-lg">
        Shop
      </Link>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary hover:bg-bg-hover rounded-lg [&::-webkit-details-marker]:hidden">
        Categories
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-1/2 top-full z-50 mt-2 w-[560px] -translate-x-1/2 border border-border bg-background p-5 shadow-elevated rounded-xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={cn(
                "flex items-baseline justify-between py-2.5 text-sm text-text-secondary",
                "transition-colors hover:text-primary rounded"
              )}
            >
              <span>{category.name}</span>
              <span className="text-xs text-text-muted">{category.productCount ?? 0}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Link href="/categories" className="link-underline">
            Browse all categories
          </Link>
          <Link href="/sellers" className="text-xs font-medium text-text-secondary hover:text-text-primary">
            Meet the sellers
          </Link>
        </div>
      </div>
    </details>
  );
}
