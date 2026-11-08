"use client";

import Link from "next/link";
import { ChevronDown, Heart, LayoutDashboard, Package, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { initials } from "@/lib/utils";
import type { UserRole } from "@/lib/constants";

const roleLabels: Record<UserRole, string> = {
  customer: "Customer account",
  seller: "Seller account",
  superadmin: "Administrator",
};

const dashboardLabels: Record<UserRole, string> = {
  customer: "My dashboard",
  seller: "Seller dashboard",
  superadmin: "Admin dashboard",
};

export function UserMenu({
  name,
  role,
  dashboardPath,
}: {
  name: string;
  role: UserRole;
  dashboardPath: string;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-1 py-1 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary ring-1 ring-primary/10">
          {initials(name) || <UserRound className="h-4 w-4" />}
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted transition-transform group-open:rotate-180 sm:block" />
        <span className="sr-only">Account menu</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-background shadow-elevated">
        <div className="border-b border-border px-4 py-3">
          <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{roleLabels[role]}</p>
        </div>
        <div className="p-1.5">
          <Link
            href={dashboardPath}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            {dashboardLabels[role]}
          </Link>
          {role !== "superadmin" ? (
            <Link
              href="/account/orders"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
            >
              <Package className="h-4 w-4" />
              My orders
            </Link>
          ) : null}
          <Link
            href="/wishlist"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
          >
            <Heart className="h-4 w-4" />
            Wishlist
          </Link>
          {role === "seller" ? (
            <Link
              href="/seller/products"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
            >
              <Package className="h-4 w-4" />
              My listings
            </Link>
          ) : null}
        </div>
        <div className="border-t border-border p-1.5">
          <SignOutButton />
        </div>
      </div>
    </details>
  );
}
