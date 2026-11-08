import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, PackageCheck, ShieldCheck, Star, Store, Truck } from "lucide-react";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { AddToCartButton } from "@/components/marketplace/AddToCartButton";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { LikeButton } from "@/components/marketplace/LikeButton";
import { ViewTracker } from "@/components/marketplace/ViewTracker";
import { CommentForm } from "@/components/marketplace/CommentForm";
import { ReviewForm } from "@/components/marketplace/ReviewForm";
import { Alert, Price } from "@/components/ui/Feedback";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getLikedProductIds,
  getPublicProductBySlug,
  getRelatedProducts,
  listProductComments,
  listProductReviews,
} from "@/services/products";
import { getWishlistIds } from "@/services/wishlist";
import { getPlatformSettings } from "@/services/settings";
import { listCustomerOrders } from "@/services/orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product" };
  const description = product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.primaryImage ? [{ url: product.primaryImage }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug).catch((error) => {
    console.error("[product] failed to load product", error);
    return null;
  });
  if (!product) notFound();

  const [comments, reviews, related, user, settings] = await Promise.all([
    listProductComments(product.id).catch(() => []),
    listProductReviews(product.id).catch(() => []),
    getRelatedProducts(product, 4).catch(() => []),
    getCurrentUser().catch(() => null),
    getPlatformSettings().catch(() => null),
  ]);

  const [likedIds, wishedIds, deliveredOrders] = user
    ? await Promise.all([
        getLikedProductIds(user.id, [product.id]).catch(() => new Set<string>()),
        getWishlistIds(user.id, [product.id]).catch(() => new Set<string>()),
        listCustomerOrders(user.id, { pageSize: 50, status: "delivered" }).catch(() => null),
      ])
    : [new Set<string>(), new Set<string>(), null];

  const reviewableOrders =
    deliveredOrders?.items
      .filter((order) => order.items.some((item) => item.productId === product.id))
      .map((order) => ({
        id: order.id,
        label: `${order.orderNumber} · delivered ${formatDateTime(order.createdAt)}`,
      })) ?? [];

  const dimensions = product.dimensions;
  const dimensionText = dimensions
    ? [
        dimensions.width ? `${dimensions.width}${dimensions.unit}` : null,
        dimensions.depth ? `${dimensions.depth}${dimensions.unit}` : null,
        dimensions.height ? `${dimensions.height}${dimensions.unit}` : null,
      ]
        .filter(Boolean)
        .join(" W × D × H")
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => image.url),
    sku: product.id,
    brand: { "@type": "Brand", name: product.seller?.shopName ?? "FurnitureX" },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url: `/product/${product.slug}`,
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  return (
    <div className="container py-8 sm:py-10">
      <ViewTracker productId={product.id} />
      {!product.isDemo ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <nav className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        <Link href="/marketplace" className="transition-colors hover:text-text-primary">
          Marketplace
        </Link>
        <span className="text-text-muted">/</span>
        {product.category ? (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="transition-colors hover:text-text-primary"
            >
              {product.category.name}
            </Link>
            <span className="text-text-muted">/</span>
          </>
        ) : null}
        <span className="truncate text-text-primary">{product.name}</span>
      </nav>

      {product.isDemo ? (
        <div className="mt-4">
          <Alert tone="info" title="Preview listing">
            This piece is development demo content for design review. It is not a live listing and
            cannot be purchased.
          </Alert>
        </div>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.seller?.shopSlug ? (
            <Link
              href={`/shop/${product.seller.shopSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              <Store className="h-3.5 w-3.5" />
              {product.seller.shopName}
            </Link>
          ) : null}

          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-text-primary sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
            <Price
              cents={product.priceCents}
              currency={product.currency}
              className="text-2xl font-semibold text-text-primary"
            />
            {product.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {product.ratingAvg.toFixed(1)} ({product.ratingCount})
              </span>
            ) : (
              <span className="text-text-muted">No reviews yet</span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  product.stock > 0 ? "bg-success" : "bg-warning"
                }`}
              />
              {product.stock > 0 ? `${product.stock} available` : "Made to order"}
            </span>
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
            {product.description}
          </p>

          {product.materials.length > 0 || dimensionText || product.color ? (
            <dl className="mt-6 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
              {product.materials.length > 0 ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    Materials
                  </dt>
                  <dd className="mt-1 text-sm text-text-primary">
                    {product.materials.join(", ")}
                  </dd>
                </div>
              ) : null}
              {dimensionText ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    Dimensions
                  </dt>
                  <dd className="mt-1 text-sm text-text-primary">{dimensionText}</dd>
                </div>
              ) : null}
              {product.color ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    Finish / colour
                  </dt>
                  <dd className="mt-1 text-sm text-text-primary">{product.color}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Delivery
                </dt>
                <dd className="mt-1 text-sm text-text-secondary">
                  Cash on Delivery
                  {settings && settings.deliveryFeeCents > 0
                    ? ` · ${formatCurrency(settings.deliveryFeeCents)} per seller order`
                    : " · Free delivery"}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-6 space-y-3">
            <AddToCartButton productId={product.id} stock={product.stock} demo={product.isDemo} />
            <div className="flex flex-wrap gap-2">
              <WishlistButton
                productId={product.id}
                initialWished={wishedIds.has(product.id)}
                withLabel
              />
              <LikeButton
                productId={product.id}
                initialLiked={likedIds.has(product.id)}
                initialCount={product.likeCount}
              />
            </div>
          </div>

          <ul className="mt-6 space-y-2.5 border-t border-border pt-5 text-xs leading-relaxed text-text-secondary">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Listing reviewed by the FurnitureX team before publication.
            </li>
            <li className="flex items-start gap-2.5">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Pay in cash when your furniture arrives. No card details stored online.
            </li>
            <li className="flex items-start gap-2.5">
              <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Dispatched directly by the maker. Order updates appear in your account.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 grid gap-8 border-t border-border pt-10 lg:grid-cols-2 lg:gap-12">
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
            Reviews
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Verified reviews from customers with delivered orders.
          </p>
          <div className="mt-5 space-y-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-text-primary">{review.author.name}</p>
                    <span
                      className="inline-flex items-center gap-0.5"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={
                            value <= review.rating
                              ? "h-3.5 w-3.5 fill-primary text-primary"
                              : "h-3.5 w-3.5 text-border"
                          }
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                    {review.content}
                  </p>
                  <p className="mt-2 text-xs text-text-muted">{formatDateTime(review.createdAt)}</p>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-5 text-sm text-text-secondary">
                No reviews yet. Delivered customers can share their experience.
              </p>
            )}
          </div>
          <div className="mt-5">
            {user ? (
              <ReviewForm productId={product.id} orderOptions={reviewableOrders} />
            ) : (
              <Alert tone="info">
                <Link
                  href={`/login?next=/product/${product.slug}`}
                  className="underline underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                to review this piece after delivery.
              </Alert>
            )}
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
            <MessageCircle className="h-5 w-5 text-primary" /> Questions & comments
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Ask the maker or share notes with other customers.
          </p>
          <div className="mt-5 space-y-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <article key={comment.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-text-primary">{comment.author.name}</p>
                    <p className="text-xs text-text-muted">{formatDateTime(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                    {comment.content}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-5 text-sm text-text-secondary">
                No comments yet. Start the conversation.
              </p>
            )}
          </div>
          <div className="mt-5">
            {user ? (
              <CommentForm productId={product.id} />
            ) : (
              <Alert tone="info">
                <Link
                  href={`/login?next=/product/${product.slug}`}
                  className="underline underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                to join the conversation.
              </Alert>
            )}
          </div>
        </section>
      </div>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-border pt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">You may also like</h2>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
            >
              Browse all
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={related} wishedIds={wishedIds} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
