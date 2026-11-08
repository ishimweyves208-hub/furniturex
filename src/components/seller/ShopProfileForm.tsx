"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Input, Label, Textarea, FieldHint } from "@/components/ui/Input";

export function ShopProfileForm({
  shopName: initialShopName,
  shopDescription: initialDescription,
  shopLogo: initialLogo,
  phone: initialPhone,
}: {
  shopName: string;
  shopDescription: string;
  shopLogo: string;
  phone: string;
}) {
  const [shopName, setShopName] = useState(initialShopName);
  const [shopDescription, setShopDescription] = useState(initialDescription);
  const [shopLogo, setShopLogo] = useState(initialLogo);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/account/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopName, shopDescription, shopLogo, phone }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      setSuccess("Shop profile updated.");
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <form onSubmit={submit} className="border border-line bg-white p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="shopName" required>Shop name</Label>
          <Input id="shopName" value={shopName} onChange={(event) => setShopName(event.target.value)} required minLength={2} maxLength={120} />
          <FieldHint>Changing the name may update your public shop URL.</FieldHint>
        </div>
        <div>
          <Label htmlFor="shopDescription">About your shop</Label>
          <Textarea id="shopDescription" value={shopDescription} onChange={(event) => setShopDescription(event.target.value)} maxLength={2000} />
        </div>
        <div>
          <Label htmlFor="shopLogo">Logo URL</Label>
          <Input id="shopLogo" value={shopLogo} onChange={(event) => setShopLogo(event.target.value)} placeholder="https://…" maxLength={500} />
        </div>
        <div>
          <Label htmlFor="phone">Contact phone</Label>
          <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save shop profile"}</Button>
      </div>
    </form>
  );
}
