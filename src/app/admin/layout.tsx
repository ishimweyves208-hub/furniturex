import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Store, UserRound } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { requirePageUser } from "@/lib/auth/session";
import { getAdminOverview } from "@/services/analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ roles: ["superadmin"], next: "/admin" });
  const overview = await getAdminOverview().catch(() => null);
  const items = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/approvals", label: "Approvals", badge: overview?.pendingApprovals },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/moderation", label: "Moderation" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/audit", label: "Audit log" },
  ];

  return (
    <div className="min-h-screen bg-bg-alternate">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> Administration
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/marketplace" className="hidden items-center gap-1 text-text-secondary hover:text-text-primary sm:inline-flex">
              <Store className="h-3.5 w-3.5" /> Marketplace
            </Link>
            <Link href="/account" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary">
              <UserRound className="h-3.5 w-3.5" /> Account
            </Link>
            <SignOutButton className="w-auto px-0 text-xs text-text-secondary hover:bg-transparent hover:text-text-primary" variant="ghost" />
          </div>
        </div>
      </header>

      <div className="container py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-10">
          <aside>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Superadmin</p>
              <p className="mt-1 text-base font-semibold text-text-primary">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">{user.email}</p>
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
