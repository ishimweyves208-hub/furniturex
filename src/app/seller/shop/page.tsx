import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ShopProfileForm } from "@/components/seller/ShopProfileForm";
import { requireActiveSellerPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Shop profile" };

export default async function SellerShopPage() {
  const user = await requireActiveSellerPage();
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Storefront</p>
          <h1 className="mt-2 text-3xl">Shop profile</h1>
          <p className="mt-2 text-sm text-muted">This information appears on your public shop page and listings.</p>
        </div>
        {user.shopSlug ? (
          <Link href={`/shop/${user.shopSlug}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal">
            View shop <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="mt-8">
        <ShopProfileForm
          shopName={user.shopName ?? ""}
          shopDescription={user.shopDescription ?? ""}
          shopLogo={user.shopLogo ?? ""}
          phone={user.phone ?? ""}
        />
      </div>
    </div>
  );
}
