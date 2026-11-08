"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ProductActions({
  productId,
  productName,
  status,
}: {
  productId: string;
  productName: string;
  status: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function remove() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/seller/products/${productId}`, { method: "DELETE" });
    const payload = (await response.json()) as
      | { ok: true; data: { archived: boolean } }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!confirming ? (
        <>
          <Link href={`/seller/products/${productId}/edit`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-charcoal">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
            aria-label={`Remove ${productName}`}
          >
            <Trash2 className="h-3.5 w-3.5" /> {status === "archived" ? "Delete" : "Remove"}
          </button>
        </>
      ) : (
        <div className="flex items-center gap-1.5">
          <Button variant="danger" size="sm" onClick={remove} disabled={pending}>
            {pending ? "Working…" : status === "archived" ? "Delete permanently" : "Remove listing"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>Cancel</Button>
        </div>
      )}
      {error ? <p className="w-full text-right text-xs text-danger">{error}</p> : null}
    </div>
  );
}
