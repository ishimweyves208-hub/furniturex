"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialWished = false,
  className,
  withLabel = false,
}: {
  productId: string;
  initialWished?: boolean;
  className?: string;
  withLabel?: boolean;
}) {
  const [wished, setWished] = useState(initialWished);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const payload = (await response.json()) as
        | { ok: true; data: { wished: boolean } }
        | { ok: false; error: { message: string } };
      if (payload.ok) setWished(payload.data.wished);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={wished}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60",
        withLabel
          ? "h-11 rounded-lg border border-border px-4 text-sm text-text-primary hover:border-primary/40 hover:text-primary"
          : "h-8 w-8 rounded-full bg-background/90 text-text-secondary shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:text-primary",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", wished && "fill-primary text-primary")} />
      {withLabel ? <span>{wished ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
