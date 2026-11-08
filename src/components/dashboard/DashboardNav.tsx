"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardNav({
  items,
  className,
}: {
  items: { href: string; label: string; badge?: number }[];
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("space-y-0.5", className)}>
      {items.map((item) => {
        const active =
          item.href === "/account" || item.href === "/seller" || item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-primary-soft hover:text-primary",
            )}
          >
            <span>{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                  active ? "bg-white text-primary" : "bg-primary text-white",
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
