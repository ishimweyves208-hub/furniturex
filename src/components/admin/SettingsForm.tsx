"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Input, Label, FieldHint } from "@/components/ui/Input";
import type { PlatformSettings } from "@/services/settings";

export function SettingsForm({ initial }: { initial: PlatformSettings }) {
  const [deliveryFee, setDeliveryFee] = useState(String(initial.deliveryFeeCents / 100));
  const [freeThreshold, setFreeThreshold] = useState(String(initial.freeDeliveryThresholdCents / 100));
  const [requireReapproval, setRequireReapproval] = useState(initial.requireReapprovalOnMaterialChange);
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail);
  const [tagline, setTagline] = useState(initial.marketplaceTagline);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryFeeCents: Math.round(Number(deliveryFee) * 100),
        freeDeliveryThresholdCents: Math.round(Number(freeThreshold) * 100),
        requireReapprovalOnMaterialChange: requireReapproval,
        supportEmail,
        marketplaceTagline: tagline,
      }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      setNotice("Settings saved. New checkouts and listings use these values.");
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <form onSubmit={submit} className="border border-line bg-white p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="deliveryFee" required>Delivery fee (USD)</Label>
          <Input id="deliveryFee" type="number" min="0" step="0.01" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} required />
          <FieldHint>Charged per seller order below the free threshold.</FieldHint>
        </div>
        <div>
          <Label htmlFor="freeThreshold" required>Free delivery threshold (USD)</Label>
          <Input id="freeThreshold" type="number" min="0" step="0.01" value={freeThreshold} onChange={(event) => setFreeThreshold(event.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="supportEmail" required>Support email</Label>
          <Input id="supportEmail" type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="tagline" required>Marketplace tagline</Label>
          <Input id="tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} required minLength={3} maxLength={200} />
        </div>
        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={requireReapproval} onChange={(event) => setRequireReapproval(event.target.checked)} className="mt-0.5" />
          <span>
            Require re-approval when listing content changes
            <span className="mt-0.5 block text-xs text-muted">Price and stock updates always go live immediately.</span>
          </span>
        </label>
      </div>
      {error ? <Alert tone="error" className="mt-5">{error}</Alert> : null}
      {notice ? <Alert tone="success" className="mt-5">{notice}</Alert> : null}
      <div className="mt-6">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
      </div>
    </form>
  );
}
