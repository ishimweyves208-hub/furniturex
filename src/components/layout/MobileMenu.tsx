"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SignOutButton } from "@/components/layout/SignOutButton";
import type { CategoryDTO } from "@/types";
import type { UserRole } from "@/lib/constants";

const links = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/about", label: "About" },
];

export function MobileMenu({
  categories,
  user,
  cartCount,
}: {
  categories: CategoryDTO[];
  user: { name: string; role: UserRole; dashboardPath: string } | null;
  cartCount: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[70] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-background p-6 shadow-elevated">
            <div className="flex items-center justify-between">
              <Logo compact />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action="/search" className="mt-8 flex overflow-hidden rounded-lg border border-border">
              <input
                name="q"
                placeholder="Search furniture"
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-text-muted focus:outline-none"
                aria-label="Search furniture"
              />
              <button
                type="submit"
                className="flex w-11 items-center justify-center text-text-secondary transition-colors hover:text-primary"
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            </form>

            <nav className="mt-6 space-y-1" aria-label="Mobile navigation">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-text-primary transition-colors hover:bg-background-hover"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/categories"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-base font-medium text-text-primary transition-colors hover:bg-background-hover"
              >
                Categories
              </Link>
            </nav>

            {categories.length > 0 ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Shop by room
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-2">
                  {categories.slice(0, 8).map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-auto space-y-2 border-t border-border pt-6">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/wishlist"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-background-hover"
                >
                  <Heart className="h-4 w-4" /> Wishlist
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-background-hover"
                >
                  <ShoppingBag className="h-4 w-4" /> Cart ({cartCount})
                </Link>
              </div>

              {user ? (
                <>
                  <Link
                    href={user.dashboardPath}
                    onClick={() => setOpen(false)}
                    className="btn-primary btn-md w-full justify-center"
                  >
                    <UserRound className="h-4 w-4" />
                    {user.name}
                  </Link>
                  <SignOutButton className="btn-outline btn-md w-full" />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-primary btn-md w-full justify-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-outline btn-md w-full justify-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
