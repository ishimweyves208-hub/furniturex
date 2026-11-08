"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";

export interface UploadedImage {
  url: string;
  key?: string;
  alt?: string;
  isPrimary?: boolean;
}

export function ImageUploader({
  images,
  onChange,
  max = 8,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  function update(next: UploadedImage[]) {
    onChange(next.map((image, index) => ({ ...image, isPrimary: index === 0 })));
  }

  async function uploadFiles(files: FileList) {
    setError(null);
    const remaining = max - images.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) return;
    setUploading(true);
    const uploaded: UploadedImage[] = [];
    for (const file of selected) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(`${file.name}: unsupported type. Use JPG, PNG, WebP or AVIF.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`${file.name}: exceeds the 8 MB limit.`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await fetch("/api/uploads/local", {
          method: "POST",
          body: formData,
        });
        const uploadPayload = (await uploadResponse.json()) as
          | { ok: true; data: { key: string; url: string } }
          | { ok: false; error: { message: string } };
        if (!uploadPayload.ok) {
          setError(uploadPayload.error.message);
          continue;
        }
        uploaded.push({ url: uploadPayload.data.url, key: uploadPayload.data.key, alt: file.name });
      } catch {
        setError("Upload failed. Check your connection.");
      }
    }
    setUploading(false);
    if (uploaded.length > 0) update([...images, ...uploaded]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function addUrl() {
    setError(null);
    if (!url.trim()) return;
    if (!/^https:\/\//i.test(url.trim())) {
      setError("Image URLs must use HTTPS.");
      return;
    }
    if (images.length >= max) {
      setError(`You can add up to ${max} images.`);
      return;
    }
    update([...images, { url: url.trim() }]);
    setUrl("");
  }

  function remove(index: number) {
    update(images.filter((_, position) => position !== index));
  }

  function makePrimary(index: number) {
    const next = [...images];
    const [item] = next.splice(index, 1);
    if (item) next.unshift(item);
    update(next);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image, index) => (
          <div key={`${image.url}-${index}`} className="group relative aspect-square overflow-hidden border border-border bg-background-alternate rounded-lg">
            <Image
              src={image.url}
              alt={image.alt ?? "Product image"}
              fill
              sizes="200px"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 rounded-b-lg">
              {index !== 0 ? (
                <button type="button" onClick={() => makePrimary(index)} className="p-1 text-white hover:text-primary" aria-label="Make primary image">
                  <Star className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-1 text-[9px] uppercase tracking-[0.12em] text-primary">
                  <Star className="h-3 w-3 fill-current" /> Primary
                </span>
              )}
              <button type="button" onClick={() => remove(index)} className="p-1 text-white hover:text-danger" aria-label="Remove image">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {images.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-border bg-background text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-60 rounded-lg"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[11px]">{uploading ? "Uploading…" : "Upload"}</span>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => { if (event.target.files) void uploadFiles(event.target.files); }}
      />
      <div className="mt-3 flex gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Or paste an HTTPS image URL"
          aria-label="Image URL"
        />
        <Button type="button" variant="outline" onClick={addUrl} disabled={images.length >= max}>
          <Link2 className="h-4 w-4" /> Add
        </Button>
      </div>
      <p className="mt-2 text-xs text-text-muted">
        First image is the primary. Up to {max} images, 8 MB each.
      </p>
      {error ? <Alert tone="error" className="mt-3">{error}</Alert> : null}
    </div>
  );
}