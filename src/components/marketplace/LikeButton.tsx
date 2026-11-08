"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function LikeButton({
  productId,
  initialLiked,
  initialCount,
}: {
  productId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const payload = (await response.json()) as
        | { ok: true; data: { liked: boolean; likeCount: number } }
        | { ok: false; error: { message: string } };
      if (payload.ok) {
        setLiked(payload.data.liked);
        setCount(payload.data.likeCount);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={liked}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm text-text-primary transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60",
        liked && "border-primary/30 bg-primary-soft text-primary",
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-primary text-primary")} />
      {count > 0 ? count : "Like"}
    </button>
  );
}
