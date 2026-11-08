"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function cancel() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    if (payload.ok) {
      router.refresh();
    } else {
      setError(payload.error.message);
      setPending(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div>
        <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
          Cancel order
        </Button>
        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm text-danger">Cancel this order? Stock will be released back to the seller.</p>
      <div className="mt-3 flex gap-2">
        <Button variant="danger" size="sm" onClick={cancel} disabled={pending}>
          {pending ? "Cancelling…" : "Yes, cancel"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          Keep order
        </Button>
      </div>
    </div>
  );
}
