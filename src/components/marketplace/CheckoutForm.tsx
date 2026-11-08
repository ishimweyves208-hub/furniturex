"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import type { AddressDTO, CartDTO, OrderDTO } from "@/types";

type Fields = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  notes: string;
  saveAddress: boolean;
};

export function CheckoutForm({
  cart,
  addresses,
  defaultName,
}: {
  cart: CartDTO;
  addresses: AddressDTO[];
  defaultName: string;
}) {
  const router = useRouter();
  const initial = addresses.find((address) => address.isDefault) ?? addresses[0];
  const [fields, setFields] = useState<Fields>({
    fullName: initial?.fullName ?? defaultName,
    phone: initial?.phone ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    addressLine2: initial?.addressLine2 ?? "",
    city: initial?.city ?? "",
    country: initial?.country ?? "",
    notes: "",
    saveAddress: addresses.length === 0,
  });
  const [selectedAddress, setSelectedAddress] = useState(initial?.id ?? "");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function chooseAddress(id: string) {
    setSelectedAddress(id);
    const address = addresses.find((entry) => entry.id === id);
    if (!address) return;
    setFields((current) => ({
      ...current,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      country: address.country,
    }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const key = idempotencyKey || crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(key);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, idempotencyKey: key }),
      });
      if (response.status === 401) {
        window.location.href = "/login?next=/checkout";
        return;
      }
      const payload = (await response.json()) as
        | { ok: true; data: { orders: OrderDTO[]; groupNumber: string } }
        | { ok: false; error: { message: string } };
      if (payload.ok) {
        const first = payload.data.orders[0];
        router.push(first ? `/account/orders/${first.id}?placed=1` : "/account/orders");
        router.refresh();
      } else {
        setError(payload.error.message);
        setIdempotencyKey(crypto.randomUUID());
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-8">
        {addresses.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl">Saved addresses</h2>
            <div className="mt-4">
              <label htmlFor="saved-address" className="form-label">
                Choose an address
              </label>
              <Select
                id="saved-address"
                value={selectedAddress}
                onChange={(event) => chooseAddress(event.target.value)}
              >
                <option value="">Enter a new address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} — {address.addressLine1}, {address.city}
                  </option>
                ))}
              </Select>
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="font-display text-2xl">Delivery details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="form-label">
                Full name
              </label>
              <Input
                id="fullName"
                value={fields.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <Input
                id="phone"
                value={fields.phone}
                onChange={(event) => update("phone", event.target.value)}
                autoComplete="tel"
                required
              />
            </div>
            <div>
              <label htmlFor="country" className="form-label">
                Country
              </label>
              <Input
                id="country"
                value={fields.country}
                onChange={(event) => update("country", event.target.value)}
                autoComplete="country-name"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine1" className="form-label">
                Address
              </label>
              <Input
                id="addressLine1"
                value={fields.addressLine1}
                onChange={(event) => update("addressLine1", event.target.value)}
                autoComplete="address-line1"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine2" className="form-label">
                Apartment, suite, landmark (optional)
              </label>
              <Input
                id="addressLine2"
                value={fields.addressLine2}
                onChange={(event) => update("addressLine2", event.target.value)}
                autoComplete="address-line2"
              />
            </div>
            <div>
              <label htmlFor="city" className="form-label">
                City
              </label>
              <Input
                id="city"
                value={fields.city}
                onChange={(event) => update("city", event.target.value)}
                autoComplete="address-level2"
                required
              />
            </div>
            <div>
              <label htmlFor="notes" className="form-label">
                Delivery notes (optional)
              </label>
              <Input
                id="notes"
                value={fields.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Gate code, delivery window…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fields.saveAddress}
                  onChange={(event) => update("saveAddress", event.target.checked)}
                  className="h-4 w-4"
                />
                Save this address to my account
              </label>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Payment</h2>
          <div className="mt-4 rounded-xl border border-border bg-background p-5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-primary" /> Cash on Delivery
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Pay the courier in cash when your furniture arrives. No card details are collected or
              stored. Orders from multiple sellers may arrive separately.
            </p>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="font-display text-2xl">Your order</h2>
          <ul className="mt-5 space-y-3 border-b border-border pb-5 text-sm">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4">
                <span className="text-text-primary">
                  {item.name} <span className="text-text-secondary">× {item.quantity}</span>
                </span>
                <span className="shrink-0">{formatCurrency(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Subtotal</dt>
              <dd>{formatCurrency(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Delivery</dt>
              <dd>{cart.deliveryFeeCents === 0 ? "Free" : formatCurrency(cart.deliveryFeeCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatCurrency(cart.totalCents)}</dd>
            </div>
          </dl>
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending || !idempotencyKey}>
            {pending ? "Placing order…" : "Place order"}
          </Button>
          <p className="mt-3 text-[11px] leading-relaxed text-text-secondary">
            By placing this order you agree to the FurnitureX terms and privacy policy. Payment is due
            on delivery.
          </p>
        </div>
      </aside>
    </form>
  );
}
