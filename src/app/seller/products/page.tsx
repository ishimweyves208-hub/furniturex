import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { ProductActions } from "@/components/seller/ProductActions";
import { requireActiveSellerPage } from "@/lib/auth/session";
import { getSellerProducts } from "@/services/products";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Listings" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const notices: Record<string, string> = {
  submitted: "Listing submitted for approval.",
  saved: "Draft saved.",
};

export default async function SellerProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireActiveSellerPage();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const status = typeof params.status === "string" && PRODUCT_STATUSES.includes(params.status as never)
    ? params.status
    : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const result = await getSellerProducts(user.id, { page, pageSize: 20, status, q });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-2 text-3xl">Listings</h1>
          <p className="mt-2 text-sm text-muted">{result.total} listing{result.total === 1 ? "" : "s"} in your shop.</p>
        </div>
        <Link href="/seller/products/new" className={buttonClasses("primary", "sm")}>New listing</Link>
      </div>

      {typeof params.notice === "string" && notices[params.notice] ? (
        <Alert tone="success" className="mt-5">{notices[params.notice]}</Alert>
      ) : null}

      <form method="get" className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search listings"
          className="w-full border border-line bg-white px-3 py-2 text-sm sm:min-w-[12rem] sm:flex-1"
        />
        <select name="status" defaultValue={status ?? ""} className="w-full border border-line bg-white px-3 py-2 text-sm sm:w-auto">
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <button type="submit" className={buttonClasses("outline", "sm", "justify-center")}>Filter</button>
      </form>

      {result.items.length > 0 ? (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {result.items.map((product) => (
              <div key={product.id} className="border border-line bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-sand">
                    {product.primaryImage ? <Image src={product.primaryImage} alt={product.name} fill sizes="56px" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/seller/products/${product.id}/edit`} className="line-clamp-2 font-medium hover:underline">{product.name}</Link>
                    <p className="mt-1 text-sm font-medium">{formatCurrency(product.priceCents)}</p>
                    <p className="text-xs text-muted">Stock {product.stock} · {product.viewCount.toLocaleString()} views</p>
                  </div>
                  <Badge tone={product.status}>{product.status}</Badge>
                </div>
                {product.moderationReason && product.status === "rejected" ? (
                  <p className="mt-2 text-[11px] text-danger">{product.moderationReason}</p>
                ) : null}
                <div className="mt-3 border-t border-line pt-3">
                  <ProductActions productId={product.id} productName={product.name} status={product.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 hidden overflow-x-auto border border-line bg-white md:block">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Views</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-sand">
                        {product.primaryImage ? (
                          <Image src={product.primaryImage} alt={product.name} fill sizes="40px" className="object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/seller/products/${product.id}/edit`} className="line-clamp-1 font-medium hover:underline">{product.name}</Link>
                        <p className="text-xs text-muted">Updated {formatDate(product.updatedAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={product.status}>{product.status}</Badge>
                    {product.moderationReason && product.status === "rejected" ? (
                      <p className="mt-1 max-w-[14rem] text-[11px] text-danger">{product.moderationReason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(product.priceCents)}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">{product.viewCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <ProductActions productId={product.id} productName={product.name} status={product.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <EmptyState
          className="mt-6"
          icon={<Package className="h-7 w-7" />}
          title={status ? `No ${status} listings` : "No listings yet"}
          description="Create your first listing and submit it for approval."
          action={<Link href="/seller/products/new" className={buttonClasses("primary")}>Create listing</Link>}
        />
      )}

      <Pagination page={result.page} totalPages={result.totalPages} pathname="/seller/products" searchParams={params} />
    </div>
  );
}
