import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Feedback";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { getAdminProduct } from "@/services/products";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Review product" };

type Params = Promise<{ id: string }>;

export default async function AdminProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getAdminProduct(id).catch(() => null);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> Products
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl">{product.name}</h1>
            <Badge tone={product.status}>{product.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            {product.seller?.shopName ?? "Seller"} · {product.category?.name ?? "Uncategorised"} · updated {formatDateTime(product.updatedAt)}
          </p>
        </div>
        <Link href={`/product/${product.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal">
          Public page <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {product.moderationReason ? (
        <div className="mt-5 border border-warning/30 bg-warning/5 p-4 text-sm text-amber-700">
          <p className="font-semibold">Moderation note</p>
          <p className="mt-1">{product.moderationReason}</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {product.images.map((image, index) => (
              <div key={`${image.url}-${index}`} className="relative aspect-square overflow-hidden bg-sand">
                <Image src={image.url} alt={image.alt ?? product.name} fill sizes="240px" className="object-cover" />
                {image.isPrimary ? (
                  <span className="absolute left-2 top-2 bg-charcoal px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-ivory">Primary</span>
                ) : null}
              </div>
            ))}
          </div>
          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-charcoal/80">{product.description}</p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Moderation</h2>
            <p className="mt-1 text-xs text-muted">Decisions notify the seller and are recorded in the audit log.</p>
            <ModerationActions productId={product.id} status={product.status} />
          </section>
          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-lg">Details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Price</dt><dd><Price cents={product.priceCents} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">Stock</dt><dd>{product.stock}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Colour</dt><dd>{product.color ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Views</dt><dd>{product.viewCount.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Sales</dt><dd>{product.salesCount}</dd></div>
            </dl>
            {product.materials.length > 0 ? <p className="mt-3 text-xs text-muted">Materials: {product.materials.join(", ")}</p> : null}
            {product.dimensions ? (
              <p className="mt-1 text-xs text-muted">
                Dimensions: {[product.dimensions.width, product.dimensions.depth, product.dimensions.height].filter(Boolean).join(" × ")} {product.dimensions.unit}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
