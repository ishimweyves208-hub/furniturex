import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Armchair, Store } from "lucide-react";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { Price } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/types";

export function ProductCard({
  product,
  wished = false,
  priority = false,
  className,
}: {
  product: ProductDTO;
  wished?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-background-alternate ring-1 ring-border/70">
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="block h-full w-full"
        >
          {product.primaryImage ? (
            <Image
              src={product.primaryImage}
              alt={product.images[0]?.alt ?? product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-text-muted">
              <Armchair className="h-10 w-10" aria-hidden />
            </span>
          )}
        </Link>

        <div className="absolute right-2.5 top-2.5">
          <WishlistButton productId={product.id} initialWished={wished} />
        </div>

        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {product.isDemo ? (
            <span className="rounded-full bg-background/95 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-text-secondary shadow-sm backdrop-blur">
              Preview
            </span>
          ) : null}
          {product.stock <= 0 ? (
            <span className="rounded-full bg-background/95 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-text-secondary shadow-sm backdrop-blur">
              Made to order
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          {product.category?.name ?? "Furniture"}
        </p>
        <h3 className="mt-1.5 text-sm font-medium leading-snug text-text-primary">
          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          {product.seller?.shopSlug ? (
            <>
              <Store className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <Link
                href={`/shop/${product.seller.shopSlug}`}
                className="truncate transition-colors hover:text-text-primary"
              >
                {product.seller.shopName}
              </Link>
            </>
          ) : (
            <span className="text-text-muted">FurnitureX seller</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <Price
            cents={product.priceCents}
            currency={product.currency}
            className="text-[15px] font-semibold tracking-tight text-text-primary"
          />
          <Link
            href={`/product/${product.slug}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Details <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
