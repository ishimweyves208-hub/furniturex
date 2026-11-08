import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductEditor } from "@/components/seller/ProductEditor";
import { Alert } from "@/components/ui/Feedback";
import { requireActiveSellerPage } from "@/lib/auth/session";
import { listActiveCategories } from "@/services/products";

export const metadata: Metadata = { title: "New listing" };

export default async function NewProductPage() {
  await requireActiveSellerPage();
  const categories = await listActiveCategories().catch(() => []);
  return (
    <div>
      <Link href="/seller/products" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> Listings
      </Link>
      <p className="eyebrow mt-4">New listing</p>
      <h1 className="mt-2 text-3xl">Add a piece</h1>
      <p className="mt-2 text-sm text-muted">Draft it privately or submit it for review when ready.</p>
      {categories.length === 0 ? (
        <Alert tone="warning" className="mt-6" title="No active categories">
          An administrator needs to create an active category before you can list products.
        </Alert>
      ) : null}
      <div className="mt-8">
        <ProductEditor categories={categories} />
      </div>
    </div>
  );
}
