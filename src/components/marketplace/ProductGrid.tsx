import { ProductCard } from "@/components/marketplace/ProductCard";
import type { ProductDTO } from "@/types";

export function ProductGrid({
  products,
  wishedIds,
  className,
}: {
  products: ProductDTO[];
  wishedIds?: Set<string>;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4"
      }
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          wished={wishedIds?.has(product.id) ?? false}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
