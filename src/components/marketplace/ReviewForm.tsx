"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  orderOptions,
}: {
  productId: string;
  orderOptions: { id: string; label: string }[];
}) {
  const [orderId, setOrderId] = useState(orderOptions[0]?.id ?? "");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, orderId, rating, content }),
      });
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (payload.ok) {
        setContent("");
        router.refresh();
      } else {
        setError(payload.error.message);
      }
    });
  }

  if (orderOptions.length === 0) {
    return (
      <p className="text-sm text-muted">
        Reviews can be written after a delivered order containing this piece.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-line bg-white p-5">
      <div>
        <label htmlFor="review-order" className="form-label">
          Delivered order
        </label>
        <Select id="review-order" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
          {orderOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <span className="form-label">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  value <= rating ? "fill-gold text-gold" : "text-line",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="review-content" className="form-label">
          Your review
        </label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          minLength={2}
          maxLength={2000}
          placeholder="How is the piece in person? Tell other customers about quality, comfort and delivery."
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <Button type="submit" size="sm" disabled={pending || content.trim().length < 2}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
