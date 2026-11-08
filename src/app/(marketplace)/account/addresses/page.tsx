import type { Metadata } from "next";
import { AddressManager } from "@/components/account/AddressManager";
import { requirePageUser } from "@/lib/auth/session";
import { listAddresses } from "@/services/addresses";

export const metadata: Metadata = { title: "Addresses", robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const user = await requirePageUser({ next: "/account/addresses" });
  const addresses = await listAddresses(user.id).catch(() => []);
  return (
    <div>
      <p className="eyebrow">Delivery</p>
      <h1 className="mt-2 text-3xl">Addresses</h1>
      <p className="mt-2 text-sm text-muted">Saved addresses make checkout faster.</p>
      <div className="mt-8">
        <AddressManager initial={addresses} />
      </div>
    </div>
  );
}
