"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { ORDER_TRANSITIONS, type OrderStatus } from "@/lib/constants";

export function OrderStatusUpdater({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const options = ORDER_TRANSITIONS[status];
  const [next, setNext] = useState<OrderStatus | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (options.length === 0) {
    return <p className="text-sm text-muted">This order is in a final state and cannot be updated.</p>;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!next) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/seller/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, note: note || undefined }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      setNote("");
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="status">New status</Label>
        <select
          id="status"
          value={next}
          onChange={(event) => setNext(event.target.value as OrderStatus)}
          className="w-full border border-line bg-white px-3 py-2.5 text-sm"
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="Shared with the customer" />
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="submit" disabled={pending}>{pending ? "Updating…" : "Update order"}</Button>
      {next === "delivered" ? (
        <p className="text-xs text-muted">Marking delivered records cash payment as paid.</p>
      ) : null}
    </form>
  );
}
