"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export function CommentForm({ productId }: { productId: string }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, content }),
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

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Share a question or thought about this piece…"
        maxLength={2000}
        required
        minLength={2}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted">Be specific and respectful. Comments are public.</p>
        <Button type="submit" size="sm" disabled={pending || content.trim().length < 2}>
          {pending ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
