import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, UserRound } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { requireActiveSellerPage } from "@/lib/auth/session";
import { getSellerOverview } from "@/services/analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Seller studio", template: "%s · Seller studio" },
  robots: { index: false, follow: false },
};

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireActiveSellerPage();
  const overview = await getSellerOverview(user.id).catch(() => null);
  const items = [
    { href: "/seller", label: "Overview" },
    { href: "/seller/products", label: "Listings" },
    { href: "/seller/orders", label: "Orders", badge: overview?.pendingTasks.pendingOrders },
    { href: "/seller/analytics", label: "Analytics" },
    { href: "/seller/shop", label: "Shop profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-primary sm:inline">
              Seller studio
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {user.shopSlug ? (
              <Link href={`/shop/${user.shopSlug}`} className="hidden items-center gap-1 text-text-secondary hover:text-text-primary sm:inline-flex">
                View shop <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
            <Link href="/account" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary">
              <UserRound className="h-3.5 w-3.5" /> Account
            </Link>
            <SignOutButton className="w-auto px-0 text-xs hover:bg-transparent" />
          </div>
        </div>
      </header>

      <div className="container py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-10">
          <aside>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your shop</p>
              <p className="mt-1 text-base font-semibold">{user.shopName ?? user.name}</p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">{user.email}</p>
              {user.sellerStatus !== "active" ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-700">
                  Seller status: {user.sellerStatus ?? "pending"}. Some actions may be limited.
                </p>
              ) : null}
              <div className="mt-4 border-t border-border pt-4">
                <DashboardNav items={items} />
              </div>
            </div>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
