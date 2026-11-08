"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  productId,
  stock,
  className,
  showQuantity = true,
  size = "lg",
  demo = false,
}: {
  productId: string;
  stock: number;
  className?: string;
  showQuantity?: boolean;
  size?: "sm" | "md" | "lg";
  demo?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  function add() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (payload.ok) {
        setMessage({ tone: "success", text: "Added to your cart." });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: payload.error.message });
      }
    });
  }

  if (demo) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        Preview listing — not available to purchase
      </Button>
    );
  }

  if (stock <= 0) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        Out of stock
      </Button>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        {showQuantity ? (
          <div className="flex h-11 w-fit items-center overflow-hidden rounded-lg border border-border bg-background">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="flex h-full w-10 items-center justify-center text-text-primary transition-colors hover:bg-background-hover disabled:opacity-40"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
              className="flex h-full w-10 items-center justify-center text-text-primary transition-colors hover:bg-background-hover disabled:opacity-40"
              aria-label="Increase quantity"
              disabled={quantity >= stock}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <Button
          variant="primary"
          size={size}
          onClick={add}
          disabled={pending}
          className="flex-1"
        >
          {pending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : message?.tone === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          )}
          {pending ? "Adding…" : message?.tone === "success" ? "Added to cart" : "Add to cart"}
        </Button>
      </div>
      {message ? (
        <p
          className={cn(
            "text-xs",
            message.tone === "success" ? "text-success" : "text-danger",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
