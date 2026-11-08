"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/utils";

interface Entry {
  id: string;
  content: string;
  status: "visible" | "hidden";
  createdAt: string;
  rating?: number;
  product?: { name?: string; slug?: string } | null;
  author?: { name?: string; email?: string } | null;
}

function Row({
  entry,
  type,
}: {
  entry: Entry;
  type: "comments" | "reviews";
}) {
  const [status, setStatus] = useState(entry.status);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle() {
    setPending(true);
    const response = await fetch(`/api/admin/moderation/${type}/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: status !== "visible" }),
    });
    const payload = (await response.json()) as { ok: boolean };
    setPending(false);
    if (payload.ok) {
      setStatus(status === "visible" ? "hidden" : "visible");
      router.refresh();
    }
  }

  return (
    <article className="border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {entry.author?.name ?? "Customer"} on {entry.product?.name ?? "listing"}
          </p>
          <p className="text-xs text-muted">{entry.author?.email} · {formatDateTime(entry.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {typeof entry.rating === "number" ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-gold">
              {Array.from({ length: entry.rating }).map((_, index) => <Star key={index} className="h-3 w-3 fill-current" />)}
            </span>
          ) : null}
          <Badge tone={status}>{status}</Badge>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{entry.content}</p>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant={status === "visible" ? "outline" : "primary"} onClick={toggle} disabled={pending}>
          {status === "visible" ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show</>}
        </Button>
      </div>
    </article>
  );
}

export function ContentModeration({
  comments,
  reviews,
}: {
  comments: Entry[];
  reviews: Entry[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl">Comments</h2>
        <div className="mt-3 space-y-3">
          {comments.length > 0 ? comments.map((entry) => <Row key={entry.id} entry={entry} type="comments" />) : (
            <EmptyState title="No comments" description="Customer questions will appear here." />
          )}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Reviews</h2>
        <div className="mt-3 space-y-3">
          {reviews.length > 0 ? reviews.map((entry) => <Row key={entry.id} entry={entry} type="reviews" />) : (
            <EmptyState title="No reviews" description="Verified purchase reviews will appear here." />
          )}
        </div>
      </section>
    </div>
  );
}
