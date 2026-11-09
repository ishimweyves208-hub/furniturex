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
        <div className="container flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Logo className="shrink-0" />
            <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> Administration
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs sm:gap-4">
            <Link href="/marketplace" className="hidden items-center gap-1 text-text-secondary hover:text-text-primary md:inline-flex">
              <Store className="h-3.5 w-3.5" /> Marketplace
            </Link>
            <Link href="/account" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary" aria-label="Account settings">
              <UserRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Account</span>
            </Link>
            <SignOutButton className="w-auto px-2 text-xs text-text-secondary hover:bg-transparent hover:text-text-primary" variant="ghost" />
          </div>
        </div>
      </header>

      <div className="container py-5 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[14rem_1fr] lg:gap-10">
          <aside className="min-w-0">
            <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Superadmin</p>
                <p className="mt-1 truncate text-base font-semibold text-text-primary">{user.name}</p>
                <p className="mt-0.5 truncate text-xs text-text-secondary">{user.email}</p>
              </div>
              <div className="mt-3 border-t border-border pt-3 sm:mt-4 sm:pt-4">
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
