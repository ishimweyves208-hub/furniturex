"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CartItemControls({
  productId,
  quantity,
  stock,
  available,
}: {
  productId: string;
  quantity: number;
  stock: number;
  available: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function update(next: number) {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/cart", {
        method: next <= 0 ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: Math.max(0, next) }),
      });
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (payload.ok) {
        router.refresh();
      } else {
        setError(payload.error.message);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-9 items-center overflow-hidden rounded-lg border border-border bg-background">
          <button
            type="button"
            onClick={() => update(quantity - 1)}
            disabled={pending}
            className="flex h-full w-8 items-center justify-center hover:bg-background-hover disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-7 text-center text-xs font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => update(quantity + 1)}
            disabled={pending || quantity >= stock || !available}
            className="flex h-full w-8 items-center justify-center hover:bg-background-hover disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => update(0)}
          disabled={pending}
          className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-danger disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
      {error ? <p className={cn("mt-1 text-xs text-danger")}>{error}</p> : null}
    </div>
  );
}
