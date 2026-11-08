import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { listAdminProducts } from "@/services/products";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const status = typeof params.status === "string" && PRODUCT_STATUSES.includes(params.status as never)
    ? params.status
    : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const result = await listAdminProducts({ page, pageSize: 20, status, q });

  return (
    <div>
      <div>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-2 text-3xl">Products</h1>
        <p className="mt-2 text-sm text-muted">{result.total} listing{result.total === 1 ? "" : "s"} across the marketplace.</p>
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search products" className="min-w-[12rem] flex-1 border border-line bg-white px-3 py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="border border-line bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((value) => (<option key={value} value={value}>{value}</option>))}
        </select>
        <button type="submit" className={buttonClasses("outline", "sm")}>Filter</button>
      </form>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Seller</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-sand">
                        {product.primaryImage ? <Image src={product.primaryImage} alt={product.name} fill sizes="40px" className="object-cover" /> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{product.name}</p>
                        <p className="text-xs text-muted">Updated {formatDate(product.updatedAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{product.seller?.shopName ?? "—"}</td>
                  <td className="px-4 py-3">{product.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(product.priceCents)}</td>
                  <td className="px-4 py-3"><Badge tone={product.status}>{product.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${product.id}`} className={buttonClasses("ghost", "sm")}>Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState className="mt-6" icon={<Package className="h-7 w-7" />} title="No products found" description="Try changing the filters." />
      )}

      <Pagination page={result.page} totalPages={result.totalPages} pathname="/admin/products" searchParams={params} />
    </div>
  );
}
