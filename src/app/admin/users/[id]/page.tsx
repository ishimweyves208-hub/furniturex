import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { UserActions } from "@/components/admin/UserActions";
import { getUserDetail } from "@/services/users";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "User detail" };

type Params = Promise<{ id: string }>;

export default async function AdminUserDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserDetail(id).catch(() => null);
  if (!user) notFound();

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> Users
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <div className="mt-2 flex gap-2">
            <Badge tone="default">{user.role}</Badge>
            <Badge tone={user.accountStatus}>{user.accountStatus}</Badge>
            {user.sellerStatus ? <Badge tone={user.sellerStatus}>{user.sellerStatus}</Badge> : null}
          </div>
        </div>
        <p className="text-xs text-muted">Joined {formatDate(user.createdAt)}</p>
      </div>

      <div className="mt-8">
        <StatGrid>
          <StatCard label="Products" value={String(user.productCount)} hint="Seller listings" />
          <StatCard label="Orders" value={String(user.orderCount)} hint={user.role === "seller" ? "Received" : "Placed"} />
          <StatCard label="Revenue" value={formatCurrency(user.deliveredRevenueCents)} hint="Delivered only" tone="positive" />
          <StatCard label="Last login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"} hint={user.emailVerified ? "Email verified" : "Email unverified"} />
        </StatGrid>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="border border-line bg-white p-6">
          <h2 className="font-display text-xl">Manage account</h2>
          <p className="mt-1 text-sm text-muted">Changes take effect immediately and are written to the audit log.</p>
          <div className="mt-5">
            <UserActions user={user} />
          </div>
        </section>
        <section className="border border-line bg-white p-6">
          <h2 className="font-display text-xl">Details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Phone</dt><dd>{user.phone ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Shop</dt><dd>{user.shopName ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Shop URL</dt><dd className="truncate">{user.shopSlug ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Last activity</dt><dd>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
