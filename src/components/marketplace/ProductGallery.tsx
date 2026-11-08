"use client";

import { useState } from "react";
import Image from "next/image";
import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImageDTO } from "@/types";

export function ProductGallery({ images, name }: { images: ProductImageDTO[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-background-alternate text-text-muted">
        <Armchair className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-background-alternate">
        <Image
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border bg-background-alternate transition-colors",
                index === active
                  ? "border-primary"
                  : "border-transparent hover:border-border",
              )}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${name} thumbnail ${index + 1}`}
                fill
                sizes="15vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
