"use client";

import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Input, Label } from "@/components/ui/Input";
import type { AddressDTO } from "@/types";

const emptyForm = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "",
  isDefault: false,
};

type FormState = typeof emptyForm;

function toForm(address: AddressDTO): FormState {
  return {
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? "",
    city: address.city,
    country: address.country,
    isDefault: address.isDefault,
  };
}

export function AddressManager({ initial }: { initial: AddressDTO[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(initial.length === 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
    setError(null);
  }

  async function reload() {
    const response = await fetch("/api/addresses");
    const payload = (await response.json()) as
      | { ok: true; data: { addresses: AddressDTO[] } }
      | { ok: false; error: { message: string } };
    if (payload.ok) setAddresses(payload.data.addresses);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const response = await fetch(editingId ? `/api/addresses/${editingId}` : "/api/addresses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      await reload();
      setNotice(editingId ? "Address updated." : "Address saved.");
      reset();
    } else {
      setError(payload.error.message);
    }
  }

  async function remove(id: string) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      await reload();
      setNotice("Address removed.");
    } else {
      setError(payload.error.message);
    }
  }

  async function makeDefault(address: AddressDTO) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/addresses/${address.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...toForm(address), isDefault: true }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      await reload();
      setNotice("Default address updated.");
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <div className="space-y-5">
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <article key={address.id} className={`border bg-white p-5 ${address.isDefault ? "border-gold/50" : "border-line"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{address.label}</p>
                {address.isDefault ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                    <Star className="h-3 w-3" /> Default
                  </span>
                ) : null}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => { setForm(toForm(address)); setEditingId(address.id); setOpen(true); setError(null); }}
                  className="p-1.5 text-muted hover:text-charcoal"
                  aria-label={`Edit ${address.label}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(address.id)}
                  disabled={pending}
                  className="p-1.5 text-muted hover:text-danger"
                  aria-label={`Delete ${address.label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-charcoal/75">
              <p>{address.fullName}</p>
              <p>{address.phone}</p>
              <p className="mt-1">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
              <p>{address.city}, {address.country}</p>
            </div>
            {!address.isDefault ? (
              <button
                type="button"
                onClick={() => makeDefault(address)}
                disabled={pending}
                className="mt-3 text-xs text-charcoal underline underline-offset-4"
              >
                Make default
              </button>
            ) : null}
          </article>
        ))}
      </div>

      {!open ? (
        <Button variant="outline" onClick={() => { setOpen(true); setForm(emptyForm); setEditingId(null); }}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      ) : (
        <form onSubmit={submit} className="border border-line bg-white p-6">
          <h2 className="font-display text-xl">{editingId ? "Edit address" : "New address"}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="label" required>Label</Label>
              <Input id="label" value={form.label} onChange={(event) => set("label", event.target.value)} required maxLength={60} placeholder="Home, Office…" />
            </div>
            <div>
              <Label htmlFor="fullName" required>Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={(event) => set("fullName", event.target.value)} required maxLength={120} />
            </div>
            <div>
              <Label htmlFor="phone" required>Phone</Label>
              <Input id="phone" value={form.phone} onChange={(event) => set("phone", event.target.value)} required maxLength={40} />
            </div>
            <div>
              <Label htmlFor="country" required>Country</Label>
              <Input id="country" value={form.country} onChange={(event) => set("country", event.target.value)} required maxLength={120} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addressLine1" required>Address line 1</Label>
              <Input id="addressLine1" value={form.addressLine1} onChange={(event) => set("addressLine1", event.target.value)} required maxLength={200} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addressLine2">Address line 2</Label>
              <Input id="addressLine2" value={form.addressLine2} onChange={(event) => set("addressLine2", event.target.value)} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="city" required>City</Label>
              <Input id="city" value={form.city} onChange={(event) => set("city", event.target.value)} required maxLength={120} />
            </div>
            <label className="flex items-end gap-2 pb-2.5 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(event) => set("isDefault", event.target.checked)} />
              Set as default
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save address"}</Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={pending}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
