import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Alert, EmptyState, Price } from "@/components/ui/Feedback";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { listAdminProducts } from "@/services/products";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Approvals" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ApprovalsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const result = await listAdminProducts({ page, pageSize: 20, status: "pending" });

  return (
    <div>
      <p className="eyebrow">Moderation</p>
      <h1 className="mt-2 text-3xl">Approval queue</h1>
      <p className="mt-2 text-sm text-muted">Review new and materially changed listings before they go live.</p>

      {result.items.length === 0 ? (
        <EmptyState className="mt-8" icon={<CheckCircle2 className="h-7 w-7" />} title="Queue clear" description="No listings are waiting for approval." />
      ) : (
        <div className="mt-8 space-y-4">
          {result.items.map((product) => (
            <article key={product.id} className="border border-line bg-white">
              <div className="flex flex-col gap-4 p-5 sm:flex-row">
                <div className="relative h-40 w-full shrink-0 overflow-hidden bg-sand sm:h-32 sm:w-40">
                  {product.primaryImage ? (
                    <Image src={product.primaryImage} alt={product.name} fill sizes="160px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-xl">{product.name}</h2>
                      <p className="mt-1 text-xs text-muted">
                        {product.seller?.shopName ?? "Seller"} · {product.category?.name ?? "Uncategorised"} · submitted {formatDate(product.updatedAt)}
                      </p>
                    </div>
                    <Price cents={product.priceCents} className="text-sm font-medium" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{product.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                    <span>Stock {product.stock}</span>
                    <span>{product.images.length} images</span>
                    {product.seller?.shopSlug ? (
                      <Link href={`/shop/${product.seller.shopSlug}`} className="underline underline-offset-4" target="_blank">
                        View shop
                      </Link>
                    ) : null}
                    <Link href={`/product/${product.slug}`} className="underline underline-offset-4" target="_blank">
                      Public preview
                    </Link>
                  </div>
                  <ModerationActions productId={product.id} status={product.status} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {result.total > result.pageSize ? (
        <Alert tone="info" className="mt-6">
          Showing {result.items.length} of {result.total} pending listings. Use the products page filters to review older submissions.
        </Alert>
      ) : null}
    </div>
  );
}
