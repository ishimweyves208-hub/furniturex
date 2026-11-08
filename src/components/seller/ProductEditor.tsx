"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Input, Label, Select, Textarea, FieldHint } from "@/components/ui/Input";
import { ImageUploader, type UploadedImage } from "@/components/seller/ImageUploader";
import type { CategoryDTO, ProductDTO } from "@/types";

export function ProductEditor({
  categories,
  product,
}: {
  categories: CategoryDTO[];
  product?: ProductDTO;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.priceCents / 100) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [color, setColor] = useState(product?.color ?? "");
  const [materials, setMaterials] = useState(product?.materials.join(", ") ?? "");
  const [width, setWidth] = useState(product?.dimensions?.width ? String(product.dimensions.width) : "");
  const [depth, setDepth] = useState(product?.dimensions?.depth ? String(product.dimensions.depth) : "");
  const [height, setHeight] = useState(product?.dimensions?.height ? String(product.dimensions.height) : "");
  const [unit, setUnit] = useState<"in" | "cm">(product?.dimensions?.unit ?? "in");
  const [images, setImages] = useState<UploadedImage[]>(product?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"draft" | "submit" | null>(null);

  async function save(action: "draft" | "submit") {
    setError(null);
    if (images.length === 0) {
      setError("Add at least one product image.");
      return;
    }
    setPending(action);
    const response = await fetch(product ? `/api/seller/products/${product.id}` : "/api/seller/products", {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryId,
        description,
        price,
        stock,
        color,
        materials,
        images: images.map((image, index) => ({ ...image, isPrimary: index === 0 })),
        dimensions: {
          width: width ? Number(width) : undefined,
          depth: depth ? Number(depth) : undefined,
          height: height ? Number(height) : undefined,
          unit,
        },
        action,
      }),
    });
    const payload = (await response.json()) as
      | { ok: true; data: { product: ProductDTO } }
      | { ok: false; error: { message: string } };
    setPending(null);
    if (payload.ok) {
      router.push(`/seller/products?notice=${action === "submit" ? "submitted" : "saved"}`);
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save("submit");
      }}
      className="space-y-6"
    >
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="border border-line bg-white p-6">
        <h2 className="font-display text-xl">The piece</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name" required>Product name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={3} maxLength={160} />
          </div>
          <div>
            <Label htmlFor="category" required>Category</Label>
            <Select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
              <option value="" disabled>Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="color">Colour / finish</Label>
            <Input id="color" value={color} onChange={(event) => setColor(event.target.value)} maxLength={80} placeholder="Natural oak" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description" required>Description</Label>
            <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} required minLength={20} maxLength={8000} className="min-h-[160px]" />
            <FieldHint>At least 20 characters. Mention materials, care and what makes it special.</FieldHint>
          </div>
          <div>
            <Label htmlFor="price" required>Price (USD)</Label>
            <Input id="price" type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </div>
          <div>
            <Label htmlFor="stock" required>Stock</Label>
            <Input id="stock" type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="materials">Materials</Label>
            <Input id="materials" value={materials} onChange={(event) => setMaterials(event.target.value)} placeholder="Oak, linen, brass" />
            <FieldHint>Comma-separated, up to 20.</FieldHint>
          </div>
        </div>
      </section>

      <section className="border border-line bg-white p-6">
        <h2 className="font-display text-xl">Dimensions</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="width">Width</Label>
            <Input id="width" type="number" min="0" step="0.1" value={width} onChange={(event) => setWidth(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="depth">Depth</Label>
            <Input id="depth" type="number" min="0" step="0.1" value={depth} onChange={(event) => setDepth(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="height">Height</Label>
            <Input id="height" type="number" min="0" step="0.1" value={height} onChange={(event) => setHeight(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select id="unit" value={unit} onChange={(event) => setUnit(event.target.value as "in" | "cm")}>
              <option value="in">inches</option>
              <option value="cm">centimetres</option>
            </Select>
          </div>
        </div>
      </section>

      <section className="border border-line bg-white p-6">
        <h2 className="font-display text-xl">Images</h2>
        <p className="mt-1 text-sm text-muted">Use natural light and show the piece from a few angles.</p>
        <div className="mt-5">
          <ImageUploader images={images} onChange={setImages} />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending !== null}>
          {pending === "submit" ? "Submitting…" : product?.status === "approved" ? "Save & resubmit" : "Submit for approval"}
        </Button>
        <Button type="button" variant="outline" onClick={() => save("draft")} disabled={pending !== null}>
          {pending === "draft" ? "Saving…" : "Save as draft"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/seller/products")} disabled={pending !== null}>
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted">
        New and materially changed listings are reviewed by an administrator before appearing in the marketplace.
        Price and stock changes go live immediately for approved listings.
      </p>
    </form>
  );
}
