import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { listCategoriesWithCounts } from "@/services/categories";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesWithCounts();
  return (
    <div>
      <p className="eyebrow">Taxonomy</p>
      <h1 className="mt-2 text-3xl">Categories</h1>
      <p className="mt-2 text-sm text-muted">Organise the marketplace and control which categories sellers can use.</p>
      <div className="mt-8">
        <CategoryManager initial={categories} />
      </div>
    </div>
  );
}
