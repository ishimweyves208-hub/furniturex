import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Armchair,
  BadgeCheck,
  CheckCircle2,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { getHomepageCollections } from "@/services/products";
import { getWishlistIds } from "@/services/wishlist";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProductDTO } from "@/types";

export const metadata: Metadata = {
  title: "FurnitureX — Furniture marketplace",
  description:
    "Discover sofas, beds, chairs, tables, storage and office furniture from independent makers. Reviewed listings, transparent USD pricing, Cash on Delivery.",
};

const trustItems = [
  { icon: BadgeCheck, label: "Reviewed listings" },
  { icon: Truck, label: "Cash on Delivery" },
  { icon: ShieldCheck, label: "Transparent USD pricing" },
];

export default async function HomePage() {
  const collections = await getHomepageCollections().catch((error) => {
    console.error("[home] failed to load collections", error);
    return null;
  });

  const user = await getCurrentUser().catch(() => null);
  const categories = collections?.categories ?? [];
  const marketplace: ProductDTO[] = collections?.marketplace ?? [];
  const popular: ProductDTO[] = collections?.popular ?? [];
  const sellers = collections?.sellers ?? [];

  const allIds = [...new Set([...marketplace, ...popular].map((item) => item.id))];
  const wishedIds = user
    ? await getWishlistIds(user.id, allIds).catch(() => new Set<string>())
    : new Set<string>();
  const hasDemo = [...marketplace, ...popular].some((item) => item.isDemo);
  const sellerCount = sellers.length;

  return (
    <>
      <section className="border-b border-border bg-background">
        <div className="container grid items-center gap-8 py-8 sm:py-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-12 lg:py-14">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-alternate px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
              <Sparkles className="h-3 w-3 text-primary" />
              Furniture for every room
            </p>
            <h1 className="mt-4 text-[2rem] font-semibold leading-[1.08] tracking-tight text-text-primary sm:text-4xl lg:text-[2.8rem]">
              Find Furniture That Makes Your Space Beautiful.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-secondary sm:text-base">
              Discover thoughtfully selected furniture for every room, from trusted independent
              sellers.
            </p>

            <form action="/search" className="mt-6">
              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    name="q"
                    placeholder="Search sofas, tables, oak…"
                    autoComplete="off"
                    aria-label="Search furniture"
                    className="h-11 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <div className="hidden h-6 w-px bg-border sm:block" />
                <select
                  name="category"
                  aria-label="Category"
                  defaultValue=""
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-text-secondary focus:border-primary focus:outline-none sm:w-40 sm:border-0 sm:bg-transparent sm:focus:ring-0"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-primary h-11 rounded-xl px-5">
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </form>

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary">
              {trustItems.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-background-alternate ring-1 ring-border/70">
              <Image
                src="/demo/hero-interior.jpg"
                alt="A bright living room with a sofa, timber table and natural textures"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                <div className="rounded-2xl bg-background/95 p-3 shadow-sm backdrop-blur sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                    New this week
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    Pieces for living, dining and rest.
                  </p>
                </div>
                <Link
                  href="/marketplace"
                  className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-text-primary shadow-sm transition-colors hover:bg-primary hover:text-white sm:flex"
                  aria-label="Browse the marketplace"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden w-32 overflow-hidden rounded-2xl border-4 border-white bg-background-alternate shadow-elevated sm:block lg:w-40">
              <div className="relative aspect-square">
                <Image
                  src="/demo/armchair.jpg"
                  alt="A sculptural lounge chair with a leather seat"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {!collections ? (
        <section className="container pt-8">
          <Alert tone="warning" title="The marketplace is being configured">
            Product data cannot load until the MongoDB connection is configured. Add{" "}
            <code className="font-mono text-xs">MONGODB_URI</code> to your environment and restart the
            application.
          </Alert>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section className="border-b border-border bg-background-alternate/60">
          <div className="container py-8 sm:py-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Browse by room</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                  Shop by category
                </h2>
              </div>
              <Link
                href="/marketplace"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-8">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group min-w-[8.5rem] overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-primary/40 sm:min-w-0"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-background-alternate">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 140px, (max-width: 1024px) 25vw, 12vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-text-muted">
                        <Armchair className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 py-2.5">
                    <p className="truncate text-[12px] font-medium text-text-primary">{category.name}</p>
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {category.productCount ?? 0} pieces
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container py-10 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">New arrivals</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              Explore Furniture
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-text-secondary">
              Discover quality pieces for your home and workspace.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {hasDemo ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            Preview collection — demonstration pieces for design review, not live listings.
          </p>
        ) : null}

        <div className="mt-7">
          {marketplace.length > 0 ? (
            <ProductGrid products={marketplace} wishedIds={wishedIds} />
          ) : (
            <EmptyState
              icon={<Armchair className="h-7 w-7" />}
              title="Furniture is on its way"
              description="Approved listings will appear here as soon as sellers publish their work."
              action={
                <Link href="/register?role=seller" className="btn-primary btn-md">
                  Become a seller
                </Link>
              }
            />
          )}
        </div>
      </section>

      {popular.length > 0 ? (
        <section className="border-y border-border bg-background-alternate">
          <div className="container py-10 sm:py-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Popular right now</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                  Most viewed furniture
                </h2>
                <p className="mt-1.5 text-sm text-text-secondary">
                  The pieces shoppers are returning to this week.
                </p>
              </div>
              <Link
                href="/marketplace?sort=popular"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
              >
                See popular pieces <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7">
              <ProductGrid products={popular} wishedIds={wishedIds} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="container py-10 sm:py-14">
        <div className="overflow-hidden rounded-3xl bg-primary-soft">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.62fr] lg:gap-10 lg:p-10">
            <div>
              <p className="eyebrow">Independent makers</p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                Have furniture to sell?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                Open a seller shop and reach customers looking for quality pieces.
                {sellerCount > 0
                  ? ` Join ${sellerCount} independent ${sellerCount === 1 ? "studio" : "studios"} already on FurnitureX.`
                  : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Free to apply
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Reviewed listings
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Direct customer orders
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/register?role=seller" className="btn-primary btn-md">
                  Start selling
                </Link>
                <Link href="/about" className="btn-outline btn-md">
                  How it works
                </Link>
              </div>
            </div>
            <div className="relative hidden aspect-[16/10] overflow-hidden rounded-2xl bg-background lg:block">
              <Image
                src="/demo/office.jpg"
                alt="A calm home office with a timber desk and natural light"
                fill
                sizes="(max-width: 1024px) 0px, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
