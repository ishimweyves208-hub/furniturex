import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { requirePageUser } from "@/lib/auth/session";
import { unreadNotificationCount } from "@/services/notifications";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ next: "/account" });
  const unread = await unreadNotificationCount(user.id).catch(() => 0);

  const items = [
    { href: "/account", label: "Overview" },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/notifications", label: "Notifications", badge: unread },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/profile", label: "Profile" },
    { href: "/account/password", label: "Password" },
    { href: "/account/sessions", label: "Devices" },
  ];

  return (
    <div className="container py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-10">
        <aside>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Account</p>
            <p className="mt-1 text-base font-semibold">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-text-secondary">{user.email}</p>
            <div className="mt-4 border-t border-border pt-4">
              <DashboardNav items={items} />
            </div>
            {user.role === "seller" ? (
              <Link href="/seller" className="mt-4 block border-t border-border pt-4 text-xs text-text-secondary hover:text-charcoal">
                Open seller studio →
              </Link>
            ) : null}
            {user.role === "superadmin" ? (
              <Link href="/admin" className="mt-4 block border-t border-border pt-4 text-xs text-text-secondary hover:text-charcoal">
                Open administration →
              </Link>
            ) : null}
            <div className="mt-4 border-t border-border pt-4">
              <SignOutButton className="text-xs text-text-secondary hover:text-charcoal" />
            </div>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
