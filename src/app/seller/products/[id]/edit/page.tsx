import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductEditor } from "@/components/seller/ProductEditor";
import { Alert } from "@/components/ui/Feedback";
import { requireActiveSellerPage } from "@/lib/auth/session";
import { getSellerProduct, listActiveCategories } from "@/services/products";

export const metadata: Metadata = { title: "Edit listing" };

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const user = await requireActiveSellerPage();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getSellerProduct(user.id, id).catch(() => null),
    listActiveCategories().catch(() => []),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/seller/products" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> Listings
      </Link>
      <p className="eyebrow mt-4">Edit listing</p>
      <h1 className="mt-2 text-3xl">{product.name}</h1>
      <p className="mt-2 text-sm text-muted">Status: {product.status} · {product.viewCount.toLocaleString()} views</p>
      {product.moderationReason ? (
        <Alert tone={product.status === "rejected" ? "error" : "warning"} className="mt-5" title="Moderation note">
          {product.moderationReason}
        </Alert>
      ) : null}
      <div className="mt-8">
        <ProductEditor categories={categories} product={product} />
      </div>
    </div>
  );
}
