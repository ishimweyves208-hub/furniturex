"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { CategoryDTO } from "@/types";

const empty = { name: "", description: "", image: "", order: "0", active: true };

export function CategoryManager({ initial }: { initial: CategoryDTO[] }) {
  const [categories, setCategories] = useState(initial);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  function reset() {
    setForm(empty);
    setEditingId(null);
    setOpen(false);
    setError(null);
  }

  async function reload() {
    const response = await fetch("/api/admin/categories");
    const payload = (await response.json()) as
      | { ok: true; data: { categories: CategoryDTO[] } }
      | { ok: false; error: { message: string } };
    if (payload.ok) {
      setCategories(payload.data.categories);
      router.refresh();
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const response = await fetch(editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        image: form.image,
        order: form.order,
        active: form.active,
      }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      await reload();
      setNotice(editingId ? "Category updated." : "Category created.");
      reset();
    } else {
      setError(payload.error.message);
    }
  }

  async function remove(category: CategoryDTO) {
    if (!window.confirm(`Delete ${category.name}? Categories with products cannot be deleted.`)) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      await reload();
      setNotice("Category deleted.");
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <div className="space-y-5">
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!open ? (
        <Button variant="outline" onClick={() => { setOpen(true); setForm(empty); setEditingId(null); }}>
          <Plus className="h-4 w-4" /> New category
        </Button>
      ) : (
        <form onSubmit={submit} className="border border-line bg-white p-6">
          <h2 className="font-display text-xl">{editingId ? "Edit category" : "New category"}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="categoryName" required>Name</Label>
              <Input id="categoryName" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} maxLength={80} />
            </div>
            <div>
              <Label htmlFor="categoryOrder">Sort order</Label>
              <Input id="categoryOrder" type="number" min="0" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea id="categoryDescription" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={500} className="min-h-[80px]" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="categoryImage">Image URL</Label>
              <Input id="categoryImage" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://…" maxLength={1000} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Active (visible to sellers)
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save category"}</Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={pending}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Products</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-3 font-medium">{category.name}</td>
                <td className="px-4 py-3 text-xs text-muted">{category.slug}</td>
                <td className="px-4 py-3">{category.order}</td>
                <td className="px-4 py-3">{category.productCount ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={category.active ? "text-xs text-success" : "text-xs text-muted"}>{category.active ? "Active" : "Hidden"}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setForm({ name: category.name, description: category.description ?? "", image: category.image ?? "", order: String(category.order), active: category.active }); setEditingId(category.id); setOpen(true); setError(null); }}
                      className="text-muted hover:text-charcoal"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => remove(category)} disabled={pending} className="text-muted hover:text-danger" aria-label={`Delete ${category.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No categories yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
